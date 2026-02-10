import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { isLoggedIn, clearToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

export default function Home() {
  const navigate = useNavigate();

  const [drones, setDrones] = useState([]);
  const [query, setQuery] = useState("");

  const loggedIn = isLoggedIn();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await api.get("/drones");
        if (!alive) return;
        setDrones(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!alive) return;
        console.error("Error fetching drones:", err);
        setDrones([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const logout = () => {
    clearToken();
    navigate("/");
  };

  const filtered = useMemo(() => {
    const raw = query.trim().toLowerCase();
    const q = raw.startsWith("#") ? raw.slice(1).trim() : raw;

    const base = [...drones].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    if (!q) return base;

    return base.filter((d) => {
      const idText = String(d.id ?? "");
      const text = `${idText} ${d.brand ?? ""} ${d.model ?? ""} ${d.drone_type ?? ""} ${d.notes ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [drones, query]);

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">Drones</h1>
            <p className="text-sm text-muted-foreground">
              Página principal pública · consulta rápida (solo lectura)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {loggedIn ? (
              <>
                <Button variant="outline" onClick={() => navigate("/manage")}>
                  Ir a Manage
                </Button>
                <Button variant="ghost" onClick={logout}>
                  Cerrar sesión
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate("/login")}>Login / Register</Button>
            )}
          </div>
        </div>
      </div>

      <Card title="Listado">
        <div className="grid gap-4">
          <Input
            label="Buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Marca, modelo, tipo, notas... (ej: DJI o #1)"
          />

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {query.trim() ? "No hay resultados para esa búsqueda." : "No hay drones todavía."}
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((drone) => (
                <li key={drone.id} className="py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="font-extrabold truncate">
                        {(drone.brand || "—")} — {(drone.model || "—")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {drone.drone_type || "—"}
                        {drone.notes ? ` · ${drone.notes}` : ""}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">#{drone.id}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="pt-1 text-xs text-muted-foreground">
            Crear/editar/borrar solo está disponible para usuarios logueados en <span className="font-bold">Manage</span>.
          </p>
        </div>
      </Card>
    </div>
  );
}
