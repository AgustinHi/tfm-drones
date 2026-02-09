import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getAuthToken() {
  return localStorage.getItem("tfm_token") || "";
}

function buildAxiosErrorMessage(err) {
  if (!err) return "Error desconocido";

  if (!err.response) {
    return "Error de red: no se pudo contactar con el servidor.";
  }

  const status = err.response.status;

  if (status === 401) {
    return "No autorizado (401). Tu sesión no es válida o ha caducado. Inicia sesión de nuevo.";
  }

  const detail = err.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return `${detail} (HTTP ${status})`;

  return `Error HTTP ${status}: ${err.response.statusText || "Error"}`;
}

export default function Manage() {
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [droneType, setDroneType] = useState("");
  const [notes, setNotes] = useState("");

  const [msg, setMsg] = useState({ type: "", text: "" });

  const token = useMemo(() => getAuthToken(), []);

  function setError(text) {
    setMsg({ type: "error", text });
  }

  function setOk(text) {
    setMsg({ type: "ok", text });
  }

  function clearMsg() {
    setMsg({ type: "", text: "" });
  }

  function validateForm() {
    if (!brand.trim()) return "La marca (brand) es obligatoria.";
    if (!model.trim()) return "El modelo (model) es obligatorio.";
    if (!droneType.trim()) return "El tipo (drone_type) es obligatorio.";
    return "";
  }

  async function fetchDrones() {
    setLoading(true);
    clearMsg();
    try {
      const res = await axios.get(`${API_BASE}/drones`);
      setDrones(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(buildAxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function createDrone(e) {
    e.preventDefault();
    clearMsg();

    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }

    if (!token) {
      setError("No hay token guardado en localStorage (tfm_token). Inicia sesión primero.");
      return;
    }

    const payload = {
      brand: brand.trim(),
      model: model.trim(),
      drone_type: droneType.trim(),
      notes: notes.trim() ? notes.trim() : null,
    };

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/drones`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDrones((prev) => [res.data, ...prev]);
      setBrand("");
      setModel("");
      setDroneType("");
      setNotes("");
      setOk("Drone creado correctamente.");
    } catch (err) {
      setError(buildAxiosErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Manage Drones</h1>

      {msg.text ? (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <strong>{msg.type === "error" ? "Error: " : "OK: "}</strong>
          {msg.text}
        </div>
      ) : null}

      <Card style={{ padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Crear drone</h2>

        <form onSubmit={createDrone} style={{ display: "grid", gap: 10 }}>
          <Input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Brand (marca)"
            autoComplete="off"
          />
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model (modelo)"
            autoComplete="off"
          />
          <Input
            value={droneType}
            onChange={(e) => setDroneType(e.target.value)}
            placeholder="Drone type (tipo)"
            autoComplete="off"
          />
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (opcional)"
            autoComplete="off"
          />

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </Button>
            <Button type="button" variant="outline" onClick={fetchDrones} disabled={loading}>
              {loading ? "Cargando..." : "Recargar"}
            </Button>
          </div>
        </form>
      </Card>

      <Card style={{ padding: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          Drones {loading ? "(cargando...)" : `(${drones.length})`}
        </h2>

        {drones.length === 0 ? (
          <p>No hay drones.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {drones.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: 12,
                  border: "1px solid #eee",
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>
                    #{d.id} — {d.brand} {d.model}
                  </strong>
                  <span>{d.drone_type}</span>
                </div>
                {d.notes ? <div style={{ marginTop: 6 }}>{d.notes}</div> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
