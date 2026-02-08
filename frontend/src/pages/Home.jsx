import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { isLoggedIn, clearToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";

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
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drones</h1>
            <p className="mt-1 text-sm text-gray-600">
              Página principal (pública): listado en solo lectura
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {loggedIn ? (
              <>
                <Link to="/manage">
                  <Button variant="outline">Gestión</Button>
                </Link>
                <Button variant="outline" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <Link to="/manage">
                <Button variant="outline">Login / Register</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Card title="Listado">
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
                      <div className="text-sm text-gray-500">#{drone.id}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Nota: crear/editar/borrar solo está disponible para usuarios logueados en
          la página de Gestión.
        </p>
      </div>
    </div>
  );
}
