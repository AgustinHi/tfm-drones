import { useEffect, useMemo, useState } from "react";
import api from "./api";
import { clearToken, isLoggedIn, setToken } from "./auth";

function App() {
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
    // GET /drones es público (sin token)
    loadDrones();
  }, []);

  const handleLogout = () => {
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
      .post("/drones", payload) // el token lo añade api.js automáticamente
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
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drones</h1>
            <p className="mt-1 text-sm text-gray-600">
              Principal: listado público · Gestión: crear/editar/borrar (solo logueado)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Log out
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50 ${
                    authMode === "login" ? "bg-gray-100" : ""
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50 ${
                    authMode === "register" ? "bg-gray-100" : ""
                  }`}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>

        {/* Auth card */}
        {!loggedIn && (
          <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">
              {authMode === "login" ? "Iniciar sesión" : "Crear usuario"}
            </h2>

            <form onSubmit={handleAuthSubmit} className="mt-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium">Email</label>
                <input
                  className="rounded-lg border px-3 py-2 outline-none focus:ring"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  required
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium">Password</label>
                <input
                  className="rounded-lg border px-3 py-2 outline-none focus:ring"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {authMode === "login" ? "Login" : "Register"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 grid gap-6">
          {/* Gestión: crear */}
          {loggedIn && (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Gestión · Añadir drone</h2>

              <form onSubmit={handleCreate} className="mt-4 grid gap-3">
                <div className="grid gap-1">
                  <label className="text-sm font-medium">Brand</label>
                  <input
                    className="rounded-lg border px-3 py-2 outline-none focus:ring"
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="DJI"
                    required
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm font-medium">Model</label>
                  <input
                    className="rounded-lg border px-3 py-2 outline-none focus:ring"
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Avata 2"
                    required
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm font-medium">Drone type</label>
                  <input
                    className="rounded-lg border px-3 py-2 outline-none focus:ring"
                    type="text"
                    value={droneType}
                    onChange={(e) => setDroneType(e.target.value)}
                    placeholder="Cinewhoop / FPV..."
                    required
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-sm font-medium">Notes</label>
                  <input
                    className="rounded-lg border px-3 py-2 outline-none focus:ring"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Add Drone
                </button>
              </form>
            </div>
          )}

          {/* Gestión: editar */}
          {loggedIn && (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Gestión · Editar drone</h2>

              {editingId == null ? (
                <p className="mt-3 text-sm text-gray-600">
                  Pulsa “Edit” en un drone del listado.
                </p>
              ) : (
                <form onSubmit={handleUpdate} className="mt-4 grid gap-3">
                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Brand</label>
                    <input
                      className="rounded-lg border px-3 py-2 outline-none focus:ring"
                      type="text"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Model</label>
                    <input
                      className="rounded-lg border px-3 py-2 outline-none focus:ring"
                      type="text"
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Drone type</label>
                    <input
                      className="rounded-lg border px-3 py-2 outline-none focus:ring"
                      type="text"
                      value={editDroneType}
                      onChange={(e) => setEditDroneType(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-1">
                    <label className="text-sm font-medium">Notes</label>
                    <input
                      className="rounded-lg border px-3 py-2 outline-none focus:ring"
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Principal: listado */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Página principal · Listado</h2>

            {sortedDrones.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No hay drones todavía.</p>
            ) : (
              <ul className="mt-4 divide-y">
                {sortedDrones.map((drone) => (
                  <li key={drone.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">
                          {drone.brand} — {drone.model}
                        </div>
                        <div className="text-sm text-gray-600">
                          {drone.drone_type}
                          {drone.notes ? ` · ${drone.notes}` : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-500">#{drone.id}</div>

                        {loggedIn && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(drone)}
                              className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(drone.id)}
                              className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
