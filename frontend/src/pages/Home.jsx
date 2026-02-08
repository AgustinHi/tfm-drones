import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { isLoggedIn, clearToken } from "../auth";
import { Link } from "react-router-dom";

export default function Home() {
  const [drones, setDrones] = useState([]);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

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
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drones</h1>
            <p className="mt-1 text-sm text-gray-600">
              Página principal (pública): listado en solo lectura
            </p>
          </div>

          <div className="flex items-center gap-2">
            {loggedIn ? (
              <>
                <Link
                  to="/manage"
                  className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  Gestión
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/manage"
                className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Listado</h2>

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
                    <div className="text-sm text-gray-500">#{drone.id}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Nota: crear/editar/borrar solo está disponible para usuarios logueados en
          la página de Gestión.
        </p>
      </div>
    </div>
  );
}
