import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { isLoggedIn, clearToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

export default function Home() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const [drones, setDrones] = useState([]);
  const [query, setQuery] = useState("");

  // Importante: si NO estás logueado, Home no llama al backend (evita 401 + redirect)
  const [infoMsg, setInfoMsg] = useState(loggedIn ? "" : "Inicia sesión para ver el listado de drones.");
  const [loading, setLoading] = useState(false);

  const logout = () => {
    clearToken();
    navigate("/");
  };

  useEffect(() => {
    let alive = true;

    // Home pública: si no hay sesión, no pedimos /drones
    if (!loggedIn) {
      setDrones([]);
      setLoading(false);
      setInfoMsg("Inicia sesión para ver el listado de drones.");
      return () => {
        alive = false;
      };
    }

    (async () => {
      setLoading(true);
      setInfoMsg("");
      try {
        const res = await api.get("/drones");
        if (!alive) return;

        const arr = Array.isArray(res.data) ? res.data : [];
        arr.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        setDrones(arr);
      } catch {
        if (!alive) return;
        setDrones([]);
        setInfoMsg("No se pudo cargar el listado.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [loggedIn]);

  const filtered = useMemo(() => {
    const raw = query.trim().toLowerCase();
    const q = raw.startsWith("#") ? raw.slice(1).trim() : raw;

    const base = [...drones];
    if (!q) return base;

    return base.filter((d) => {
      const idText = String(d.id ?? "");
      const text = `${idText} ${d.name ?? ""} ${d.comment ?? ""} ${d.controller ?? ""} ${d.video ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [drones, query]);

  return (
    <div className="grid gap-6">
      {/* Hero / panel principal (mismo lenguaje que Login) */}
      <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        {/* Radial visible: centro más claro, bordes más oscuros */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-primary/4" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

        <div className="relative grid gap-5 md:grid-cols-[1.6fr_0.9fr] md:items-start">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/45 px-3 py-2 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <span className="text-xs font-extrabold tracking-wide text-muted-foreground">DRONHANGAR</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-xs font-semibold text-muted-foreground">consulta y gestión</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight">DronHangar</h1>

            <p className="text-sm text-muted-foreground">
              Consulta rápida del sistema. Para crear, editar o borrar drones necesitas iniciar sesión y acceder a{" "}
              <span className="font-bold text-foreground">Gestión</span>.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {loggedIn ? (
                <>
                  <Button onClick={() => navigate("/manage")}>Ir a Gestión</Button>
                  <Button variant="outline" onClick={logout}>
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigate("/login")}>Iniciar sesión / Crear cuenta</Button>
                  <Button variant="outline" onClick={() => navigate("/manage")}>
                    Ver Gestión
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="text-xs font-semibold text-muted-foreground">Drones disponibles</div>
              <div className="mt-2 text-3xl font-extrabold tracking-tight">
                {!loggedIn ? "—" : loading ? "…" : drones.length}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Consejo: busca por <span className="font-bold text-foreground">texto</span> o por{" "}
                <span className="font-bold text-foreground">#id</span>.
              </div>
            </div>

            <div className="rounded-2xl bg-white/45 p-4 text-xs text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="font-semibold text-foreground">Acceso protegido</div>
              <div className="mt-1">
                CRUD completo en <span className="font-bold text-foreground">Gestión</span> con sesión (JWT).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
          <div className="text-sm font-extrabold">Consulta rápida</div>
          <div className="mt-1 text-sm text-muted-foreground">Filtra por texto en tiempo real.</div>
        </div>

        <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
          <div className="text-sm font-extrabold">Acceso protegido</div>
          <div className="mt-1 text-sm text-muted-foreground">Crear/editar/borrar solo en Gestión.</div>
        </div>

        <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
          <div className="text-sm font-extrabold">Dumps</div>
          <div className="mt-1 text-sm text-muted-foreground">Pantallas preparadas para ver y parsear.</div>
        </div>
      </div>

      {/* Listado */}
      <Card title="Listado (solo lectura)" className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="grid gap-4">
          <Input
            label="Buscar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre, comentario… (ej: cinewhoop o #1)"
            disabled={!loggedIn}
          />

          {infoMsg ? (
            <div className="rounded-2xl bg-white/45 px-4 py-3 text-sm text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              {infoMsg}
            </div>
          ) : null}

          {!loggedIn ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => navigate("/login")}>Iniciar sesión / Crear cuenta</Button>
              <Button variant="outline" onClick={() => navigate("/manage")}>
                Ir a Gestión
              </Button>
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {query.trim() ? "No hay resultados para esa búsqueda." : "No hay drones para mostrar."}
            </p>
          ) : (
            <ul className="divide-y divide-black/10 rounded-2xl bg-white/45 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              {filtered.map((d) => (
                <li key={d.id} className="px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-extrabold">{d.name || "—"}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {d.comment ? d.comment : "Sin comentario"}
                      </div>
                    </div>

                    <div className="shrink-0 text-sm font-semibold text-muted-foreground">#{d.id}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
