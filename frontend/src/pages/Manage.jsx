import { useEffect, useState } from "react";
import api, { getToken } from "../api";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

function buildErrorMessage(err) {
  if (!err?.response) return "Error de red: no se pudo contactar con el servidor.";

  const status = err.response.status;
  if (status === 401) return "No autorizado (401). Tu sesión no es válida o ha caducado.";

  const detail = err.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return `${detail} (HTTP ${status})`;

  return `Error HTTP ${status}: ${err.response.statusText || "Error"}`;
}

const CONTROLLERS = ["", "Betaflight", "Kiss"];
const VIDEOS = ["", "Analogico", "Digital"];

export default function Manage() {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formulario de creación rápida
  const [newName, setNewName] = useState("");
  const [newComment, setNewComment] = useState("");

  // Edición en tarjeta desplegada
  const [openId, setOpenId] = useState(null);
  const [editId, setEditId] = useState(null);

  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [controller, setController] = useState("");
  const [video, setVideo] = useState("");
  const [radio, setRadio] = useState("");
  const [components, setComponents] = useState("");

  const [msg, setMsg] = useState({ type: "", text: "" });

  function setError(text) {
    setMsg({ type: "error", text });
  }
  function setOk(text) {
    setMsg({ type: "ok", text });
  }
  function clearMsg() {
    setMsg({ type: "", text: "" });
  }

  function toggleOpen(id) {
    setOpenId((curr) => (curr === id ? null : id));
  }

  function resetEdit() {
    setEditId(null);
    setName("");
    setComment("");
    setController("");
    setVideo("");
    setRadio("");
    setComponents("");
  }

  function startEdit(d) {
    clearMsg();
    setEditId(d.id);
    setOpenId(d.id);

    setName(d.name ?? "");
    setComment(d.comment ?? "");
    setController(d.controller ?? "");
    setVideo(d.video ?? "");
    setRadio(d.radio ?? "");
    setComponents(d.components ?? "");
  }

  function cancelEdit() {
    clearMsg();
    resetEdit();
  }

  async function fetchDrones() {
    setLoading(true);
    clearMsg();
    try {
      const res = await api.get("/drones");
      const arr = Array.isArray(res.data) ? res.data : [];
      arr.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      setDrones(arr);
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function createDrone(e) {
    e.preventDefault();
    clearMsg();

    if (!getToken()) {
      setError("No hay sesión activa. Inicia sesión para gestionar drones.");
      return;
    }

    const n = newName.trim();
    const c = newComment.trim();

    if (!n) {
      setError("El Nombre es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: n,
        comment: c ? c : null,
        controller: null,
        video: null,
        radio: null,
        components: null,

        // compat (no lo usamos ya, pero el backend lo acepta)
        brand: "",
        model: "",
        drone_type: "",
        notes: null,
      };

      const res = await api.post("/drones", payload); // 201
      setDrones((prev) => [res.data, ...prev]);
      setNewName("");
      setNewComment("");
      setOk("Drone creado correctamente.");
      setOpenId(res.data?.id ?? null);
      startEdit(res.data);
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit() {
    clearMsg();

    if (!getToken()) {
      setError("No hay sesión activa. Inicia sesión para gestionar drones.");
      return;
    }

    if (editId == null) return;

    const n = name.trim();
    const c = comment.trim();

    if (!n) {
      setError("El Nombre es obligatorio.");
      return;
    }

    // Normalizamos valores vacíos a null para enums/campos opcionales
    const payload = {
      name: n,
      comment: c ? c : null,
      controller: controller ? controller : null,
      video: video ? video : null,
      radio: radio.trim() ? radio.trim() : null,
      components: components.trim() ? components.trim() : null,

      // compat
      brand: "",
      model: "",
      drone_type: "",
      notes: null,
    };

    setLoading(true);
    try {
      const res = await api.put(`/drones/${editId}`, payload);
      setDrones((prev) => prev.map((d) => (d.id === editId ? res.data : d)));
      setOk("Cambios guardados.");
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteDrone(d) {
    clearMsg();

    if (!getToken()) {
      setError("No hay sesión activa. Inicia sesión para gestionar drones.");
      return;
    }

    const ok = window.confirm(`¿Borrar el drone #${d.id} — ${d.name}?`);
    if (!ok) return;

    setLoading(true);
    try {
      await api.delete(`/drones/${d.id}`); // 204
      setDrones((prev) => prev.filter((x) => x.id !== d.id));
      if (openId === d.id) setOpenId(null);
      if (editId === d.id) resetEdit();
      setOk("Drone eliminado.");
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Manage Drones</h1>
        <Button type="button" variant="outline" onClick={fetchDrones} disabled={loading}>
          {loading ? "Cargando..." : "Recargar"}
        </Button>
      </div>

      {msg.text ? (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: "1px solid #ddd" }}>
          <strong>{msg.type === "error" ? "Error: " : "OK: "}</strong>
          {msg.text}
        </div>
      ) : null}

      {/* Creación rápida */}
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Crear drone</h2>

        <form onSubmit={createDrone} style={{ display: "grid", gap: 10 }}>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre" autoComplete="off" />
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Comentario (opcional)"
            autoComplete="off"
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista en tarjetas */}
      <Card style={{ padding: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          Drones {loading ? "(cargando...)" : `(${drones.length})`}
        </h2>

        {drones.length === 0 ? (
          <p>No hay drones.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {drones.map((d) => {
              const isOpen = openId === d.id;
              const isEditingThis = editId === d.id;

              return (
                <div
                  key={d.id}
                  onClick={() => toggleOpen(d.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleOpen(d.id);
                  }}
                  style={{
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 10,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  {/* Tarjeta compacta: ID + Nombre + Comentario */}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong style={{ fontSize: 14 }}>
                        #{d.id} — {d.name}
                      </strong>
                      <span style={{ fontSize: 12, opacity: 0.75 }}>{d.comment ?? ""}</span>
                    </div>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>

                  {/* Desplegado */}
                  {isOpen ? (
                    <div
                      style={{ marginTop: 12, display: "grid", gap: 10 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isEditingThis ? (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Button type="button" variant="outline" disabled={loading} onClick={() => startEdit(d)}>
                            Editar
                          </Button>
                          <Button type="button" variant="outline" disabled={loading} onClick={() => deleteDrone(d)}>
                            Borrar
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "grid", gap: 10 }}>
                            <div style={{ fontSize: 12, opacity: 0.75 }}>ID: {d.id}</div>

                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" />

                            <Input
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Comentario"
                            />

                            {/* Select Controladora */}
                            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                              <span style={{ opacity: 0.75 }}>Controladora</span>
                              <select
                                value={controller}
                                onChange={(e) => setController(e.target.value)}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 10,
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {CONTROLLERS.map((x) => (
                                  <option key={x} value={x}>
                                    {x === "" ? "—" : x}
                                  </option>
                                ))}
                              </select>
                            </label>

                            {/* Select Video */}
                            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                              <span style={{ opacity: 0.75 }}>Video</span>
                              <select
                                value={video}
                                onChange={(e) => setVideo(e.target.value)}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 10,
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {VIDEOS.map((x) => (
                                  <option key={x} value={x}>
                                    {x === "" ? "—" : x}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <Input value={radio} onChange={(e) => setRadio(e.target.value)} placeholder="Radio" />

                            {/* Textarea Componentes */}
                            <label style={{ display: "grid", gap: 6, fontSize: 12 }}>
                              <span style={{ opacity: 0.75 }}>Componentes</span>
                              <textarea
                                value={components}
                                onChange={(e) => setComponents(e.target.value)}
                                placeholder="Componentes (texto libre)"
                                rows={4}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 10,
                                  border: "1px solid #e5e7eb",
                                  resize: "vertical",
                                }}
                              />
                            </label>
                          </div>

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <Button type="button" disabled={loading} onClick={saveEdit}>
                              {loading ? "Guardando..." : "Guardar"}
                            </Button>
                            <Button type="button" variant="outline" disabled={loading} onClick={cancelEdit}>
                              Cancelar
                            </Button>
                            <Button type="button" variant="outline" disabled={loading} onClick={() => deleteDrone(d)}>
                              Borrar
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
