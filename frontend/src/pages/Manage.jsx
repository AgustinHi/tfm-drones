import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { clearToken, isLoggedIn, setToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

export default function Manage() {
  const [drones, setDrones] = useState([]);

  // Auth
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Create
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [droneType, setDroneType] = useState("");
  const [notes, setNotes] = useState("");

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editDroneType, setEditDroneType] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const sortedDrones = useMemo(() => {
    return [...drones].sort((a, b) => a.id - b.id);
  }, [drones]);

  const loadDrones = () => {
    api
      .get("/drones")
      .then((res) => setDrones(res.data))
      .catch((err) => console.error("Error fetching drones:", err));
  };

  useEffect(() => {
    loadDrones();
  }, []);

  const logout = () => {
    clearToken();
    setLoggedIn(false);
    setEditingId(null);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();

    if (authMode === "register") {
      api
        .post("/auth/register", { email, password })
        .then((res) => {
          if (res.data?.error) {
            alert(res.data.error);
            return;
          }
          alert("Usuario creado. Ahora inicia sesión.");
          setAuthMode("login");
        })
        .catch((err) => console.error("Error register:", err));
      return;
    }

    api
      .post("/auth/login", { email, password })
      .then((res) => {
        if (res.data?.error) {
          alert(res.data.error);
          return;
        }
        setToken(res.data.access_token);
        setLoggedIn(true);
      })
      .catch((err) => console.error("Error login:", err));
  };

  const handleCreate = (e) => {
    e.preventDefault();

    const payload = {
      brand,
      model,
      drone_type: droneType,
      notes,
    };

    api
      .post("/drones", payload)
      .then(() => {
        setBrand("");
        setModel("");
        setDroneType("");
        setNotes("");
        loadDrones();
      })
      .catch((err) => console.error("Error creating drone:", err));
  };

  const startEdit = (drone) => {
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

  const handleUpdate = (e) => {
    e.preventDefault();
    if (editingId == null) return;

    const payload = {
      brand: editBrand,
      model: editModel,
      drone_type: editDroneType,
      notes: editNotes,
    };

    api
      .put(`/drones/${editingId}`, payload)
      .then(() => {
        cancelEdit();
        loadDrones();
      })
      .catch((err) => console.error("Error updating drone:", err));
  };

  const handleDelete = (id) => {
    api
      .delete(`/drones/${id}`)
      .then(() => {
        if (editingId === id) cancelEdit();
        loadDrones();
      })
      .catch((err) => console.error("Error deleting drone:", err));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión</h1>
            <p className="mt-1 text-sm text-gray-600">
              Página secundaria: login/register + CRUD de drones (solo logueados)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/">
              <Button variant="outline">Volver</Button>
            </Link>
            {loggedIn && (
              <Button variant="outline" onClick={logout}>
                Log out
              </Button>
            )}
          </div>
        </div>

        {!loggedIn && (
          <div className="mt-6">
            <Card title="Acceso">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={authMode === "login" ? "default" : "outline"}
                  onClick={() => setAuthMode("login")}
                >
                  Login
                </Button>
                <Button
                  variant={authMode === "register" ? "default" : "outline"}
                  onClick={() => setAuthMode("register")}
                >
                  Register
                </Button>
              </div>

              <form onSubmit={handleAuthSubmit} className="mt-4 grid gap-3">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  required
                />
                <Button type="submit">
                  {authMode === "login" ? "Login" : "Register"}
                </Button>
              </form>
            </Card>
          </div>
        )}

        {loggedIn && (
          <div className="mt-6 grid gap-6">
            <Card title="Añadir drone">
              <form onSubmit={handleCreate} className="grid gap-3">
                <Input
                  label="Brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
                <Input
                  label="Model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
                <Input
                  label="Drone type"
                  value={droneType}
                  onChange={(e) => setDroneType(e.target.value)}
                  required
                />
                <Input
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button type="submit">Add Drone</Button>
              </form>
            </Card>

            <Card title="Editar drone">
              {editingId == null ? (
                <p className="text-sm text-gray-600">
                  Pulsa “Edit” en un drone del listado.
                </p>
              ) : (
                <form onSubmit={handleUpdate} className="grid gap-3">
                  <Input
                    label="Brand"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    required
                  />
                  <Input
                    label="Model"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    required
                  />
                  <Input
                    label="Drone type"
                    value={editDroneType}
                    onChange={(e) => setEditDroneType(e.target.value)}
                    required
                  />
                  <Input
                    label="Notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit">Save</Button>
                    <Button variant="outline" onClick={cancelEdit}>
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
                          <Button variant="outline" onClick={() => startEdit(drone)}>
                            Edit
                          </Button>
                          <Button variant="outline" onClick={() => handleDelete(drone.id)}>
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
        )}
      </div>
    </div>
  );
}
