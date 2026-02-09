import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { isLoggedIn, clearToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

export default function Home() {
  const [drones, setDrones] = useState([]);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...drones].sort((a, b) => a.id - b.id);
    if (!q) return base;

    return base.filter((d) => {
      const text = `${d.id} ${d.brand ?? ""} ${d.model ?? ""} ${d.drone_type ?? ""} ${d.notes ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [drones, query]);

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
            <div className="mb-4">
              <Input
                label="Buscar"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Marca, modelo, tipo, notas..."
              />
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-gray-600">
                {query.trim() ? "No hay resultados para esa búsqueda." : "No hay drones todavía."}
              </p>
            ) : (
              <ul className="divide-y">
                {filtered.map((drone) => (
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
          Nota: crear/editar/borrar solo está disponible para usuarios logueados en la página de Gestión.
        </p>
      </div>
    </div>
  );
}
