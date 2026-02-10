import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
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

export default function Manage() {
  const navigate = useNavigate();

  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Crear
  const [newName, setNewName] = useState("");
  const [newComment, setNewComment] = useState("");

  // Buscar
  const [query, setQuery] = useState("");

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

    const n = newName.trim();
    const c = newComment.trim();
    if (!n) return setError("El Nombre es obligatorio.");

    setLoading(true);
    try {
      const payload = {
        name: n,
        comment: c ? c : null,
        controller: null,
        video: null,
        radio: null,
        components: null,
      };

      const res = await api.post("/drones", payload);
      setDrones((prev) => [res.data, ...prev]);
      setNewName("");
      setNewComment("");
      setOk("Dron creado correctamente.");
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteDrone(d) {
    clearMsg();

    const expected = `BORRAR #${d.id}`;
    const typed = window.prompt(
      `Para borrar este dron escribe exactamente:\n\n${expected}\n\nDron: ${d.name || "—"}`
    );

    if (typed == null) return;
    if (typed.trim() !== expected) {
      setError(`Cancelado. Debes escribir exactamente: ${expected}`);
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/drones/${d.id}`);
      setDrones((prev) => prev.filter((x) => x.id !== d.id));
      setOk("Dron eliminado.");
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const raw = query.trim().toLowerCase();
    const q = raw.startsWith("#") ? raw.slice(1).trim() : raw;

    const base = [...drones];
    if (!q) return base;

    return base.filter((d) => {
      const idText = String(d.id ?? "");
      const text = `${idText} ${d.name ?? ""} ${d.comment ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [drones, query]);

  useEffect(() => {
    fetchDrones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">Manage</h1>
            <p className="text-sm text-muted-foreground">Crear drones y gestionar tus tarjetas</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={fetchDrones} disabled={loading}>
              {loading ? "Cargando..." : "Recargar"}
            </Button>
          </div>
        </div>
      </div>

      {msg.text ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            msg.type === "ok"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          ].join(" ")}
        >
          {msg.text}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4">
          <Card title={`Drones (${drones.length})`}>
            <div className="grid gap-4">
              <Input
                label="Buscar"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre, comentario… (ej: #3 o 'cinewhoop')"
              />

              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {query.trim() ? "No hay resultados para esa búsqueda." : "No hay drones creados todavía."}
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filtered.map((d) => (
                    <div key={d.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-muted-foreground">#{d.id}</div>
                          <div className="mt-1 text-lg font-extrabold leading-tight truncate">
                            {d.name || "—"}
                          </div>
                          {d.comment ? (
                            <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{d.comment}</div>
                          ) : (
                            <div className="mt-1 text-sm text-muted-foreground">Sin comentario</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button onClick={() => navigate(`/drones/${d.id}`)} disabled={loading}>
                          Ver
                        </Button>

                        <Button variant="danger" onClick={() => deleteDrone(d)} disabled={loading}>
                          Borrar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card title="Crear dron">
            <form onSubmit={createDrone} className="grid gap-3">
              <Input
                label="Nombre"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Cinewhoop 2.5"
                autoComplete="off"
              />
              <Input
                label="Comentario (opcional)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ej: Setup indoor / vídeo digital…"
                autoComplete="off"
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Consejo: usa un nombre claro para no equivocarte en campo.
              </p>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
