import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [drones, setDrones] = useState([]);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [droneType, setDroneType] = useState("");
  const [notes, setNotes] = useState("");

  const loadDrones = () => {
    axios
      .get(`${API_BASE}/drones`)
      .then((response) => setDrones(response.data))
      .catch((error) => console.error("Error fetching drones:", error));
  };

  useEffect(() => {
    loadDrones();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      brand,
      model,
      drone_type: droneType,
      notes,
    };

    axios
      .post(`${API_BASE}/drones`, payload)
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
    axios
      .delete(`${API_BASE}/drones/${id}`)
      .then(() => loadDrones())
      .catch((error) => console.error("Error deleting drone:", error));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-bold tracking-tight">Drones</h1>
        <p className="mt-1 text-sm text-gray-600">
          MVP: listado, alta y borrado
        </p>

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

        <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Listado</h2>

          {drones.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No hay drones todavía.</p>
          ) : (
            <ul className="mt-4 divide-y">
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
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
