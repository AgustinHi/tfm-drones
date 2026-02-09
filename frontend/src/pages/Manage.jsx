import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { clearToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

export default function Manage() {
  const navigate = useNavigate();

  const [drones, setDrones] = useState([]);

  const [crudError, setCrudError] = useState("");
  const [crudSuccess, setCrudSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [droneType, setDroneType] = useState("");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editDroneType, setEditDroneType] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const sortedDrones = useMemo(() => {
    return [...drones].sort((a, b) => a.id - b.id);
  }, [drones]);

  const resetFeedback = () => {
    setCrudError("");
    setCrudSuccess("");
  };

  const loadDrones = () => {
    api
      .get("/drones")
      .then((res) => setDrones(res.data))
      .catch((err) => console.error("Error fetching drones:", err));
  };

  useEffect(() => {
    loadDrones();
  }, []);

  // ✅ logout global (401) -> /login con motivo "expired"
  useEffect(() => {
    const onLogout = () => {
      setEditingId(null);
      setBusy(false);
      resetFeedback();
      navigate("/login", { replace: true, state: { reason: "expired", from: "/manage" } });
    };

    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [navigate]);

  const logout = () => {
    clearToken();
    setEditingId(null);
    resetFeedback();
    navigate("/login", { replace: true });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    resetFeedback();

    const payload = {
      brand: brand.trim(),
      model: model.trim(),
      drone_type: droneType.trim(),
      notes: notes.trim() || null,
    };

    if (!payload.brand || !payload.model || !payload.drone_type) {
      setCrudError("Brand, Model y Drone type son obligatorios.");
      return;
    }

    try {
      setBusy(true);
      await api.post("/drones", payload);
      setBrand("");
      setModel("");
      setDroneType("");
      setNotes("");
      setCrudSuccess("Drone creado.");
      loadDrones();
    } catch (err) {
      if (!err?.response) setCrudError("Backend no disponible (¿backend apagado?).");
      else if (err.response.status !== 401) setCrudError("No se pudo crear.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (drone) => {
    resetFeedback();
    setEditingId(drone.id);
    setEditBrand(drone.brand ?? "");
    setEditModel(drone.model ?? "");
    setEditDroneType(drone.drone_type ?? "");
    setEditNotes(drone.notes ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditBrand("");
    setEditModel("");
    setEditDroneType("");
    setEditNotes("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    resetFeedback();
    if (editingId == null) return;

    const payload = {
      brand: editBrand.trim(),
      model: editModel.trim(),
      drone_type: editDroneType.trim(),
      notes: editNotes.trim() || null,
    };

    if (!payload.brand || !payload.model || !payload.drone_type) {
      setCrudError("Brand, Model y Drone type son obligatorios.");
      return;
    }

    try {
      setBusy(true);
      await api.put(`/drones/${editingId}`, payload);
      setCrudSuccess("Drone actualizado.");
      cancelEdit();
      loadDrones();
    } catch (err) {
      if (!err?.response) setCrudError("Backend no disponible (¿backend apagado?).");
      else if (err.response.status !== 401) setCrudError("No se pudo actualizar.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    resetFeedback();
    try {
      setBusy(true);
      await api.delete(`/drones/${id}`);
      setCrudSuccess("Drone borrado.");
      if (editingId === id) cancelEdit();
      loadDrones();
    } catch (err) {
      if (!err?.response) setCrudError("Backend no disponible (¿backend apagado?).");
      else if (err.response.status !== 401) setCrudError("No se pudo borrar.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión</h1>
            <p className="mt-1 text-sm text-gray-600">CRUD (solo logueados)</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/">
              <Button variant="outline">Volver</Button>
            </Link>
            <Button variant="outline" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>

        {(crudError || crudSuccess) && (
          <div className="mt-6 grid gap-2">
            {crudError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">{crudError}</div>
            ) : null}
            {crudSuccess ? (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">{crudSuccess}</div>
            ) : null}
          </div>
        )}

        <div className="mt-6 grid gap-6">
          <Card title="Añadir drone">
            <form onSubmit={handleCreate} className="grid gap-3">
              <Input label="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
              <Input label="Model" value={model} onChange={(e) => setModel(e.target.value)} required />
              <Input label="Drone type" value={droneType} onChange={(e) => setDroneType(e.target.value)} required />
              <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button type="submit" disabled={busy}>
                {busy ? "Creando..." : "Add Drone"}
              </Button>
            </form>
          </Card>

          <Card title="Editar drone">
            {editingId == null ? (
              <p className="text-sm text-gray-600">Pulsa “Edit” en un drone del listado.</p>
            ) : (
              <form onSubmit={handleUpdate} className="grid gap-3">
                <Input label="Brand" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} required />
                <Input label="Model" value={editModel} onChange={(e) => setEditModel(e.target.value)} required />
                <Input
                  label="Drone type"
                  value={editDroneType}
                  onChange={(e) => setEditDroneType(e.target.value)}
                  required
                />
                <Input label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={busy}>
                    {busy ? "Guardando..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={busy}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <Card title="Listado (con acciones)">
            {sortedDrones.length === 0 ? (
              <p className="text-sm text-gray-600">No hay drones todavía.</p>
            ) : (
              <ul className="divide-y">
                {sortedDrones.map((drone) => (
                  <li key={drone.id} className="py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium">
                          {drone.brand} — {drone.model}
                        </div>
                        <div className="text-sm text-gray-600">
                          {drone.drone_type}
                          {drone.notes ? ` · ${drone.notes}` : ""}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm text-gray-500">#{drone.id}</div>
                        <Button variant="outline" onClick={() => startEdit(drone)} disabled={busy}>
                          Edit
                        </Button>
                        <Button variant="outline" onClick={() => handleDelete(drone.id)} disabled={busy}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
