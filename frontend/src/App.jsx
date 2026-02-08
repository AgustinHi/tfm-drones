import { useEffect, useState } from "react";
import axios from "axios";
import { isLoggedIn, setToken, clearToken } from "./auth";
import api from "./api";

function App() {
  const [drones, setDrones] = useState([]);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [droneType, setDroneType] = useState("");
  const [notes, setNotes] = useState("");
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  const loadDrones = () => {
    api
      .get("/drones")
      .then((response) => setDrones(response.data))
      .catch((error) => console.error("Error fetching drones:", error));
  };

  useEffect(() => {
    if (loggedIn) loadDrones();
  }, [loggedIn]);

  const handleSubmit = (e) => {
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
      .catch((error) => console.error("Error creating drone:", error));
  };

  const handleDelete = (id) => {
    api
      .delete(`/drones/${id}`)
      .then(() => loadDrones())
      .catch((error) => console.error("Error deleting drone:", error));
  };

  const handleLogin = (email, password) => {
    api
      .post("/auth/login", { email, password })
      .then((response) => {
        setToken(response.data.access_token);
        setLoggedIn(true);
      })
      .catch((error) => console.error("Error logging in:", error));
  };

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-bold tracking-tight">Drones</h1>
        <p className="mt-1 text-sm text-gray-600">
          MVP: listado, alta, edición y borrado de drones
        </p>

        <div className="mt-6">
          {!loggedIn ? (
            <div>
              <button
                onClick={() => handleLogin("test@example.com", "123456")}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Log In
              </button>
              <button
                onClick={() => setLoggedIn(true)}
                className="ml-2 bg-green-500 text-white px-4 py-2 rounded"
              >
                Register
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Log Out
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          <ul className="divide-y">
            {drones.map((drone) => (
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

                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">#{drone.id}</div>
                    <button
                      type="button"
                      onClick={() => handleDelete(drone.id)}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {loggedIn && (
          <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Añadir drone</h2>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
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
      </div>
    </div>
  );
}

export default App;
