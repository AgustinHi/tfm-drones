// frontend/src/pages/HomeLogged.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { clearToken } from "../auth";
import Button from "../ui/Button";
import Input from "../ui/Input";
import MessageBanner from "../ui/MessageBanner";
import { useTranslation } from "react-i18next";

function buildErrorMessage(err, tv) {
  // Axios timeout (api.js timeout: 15000ms)
  if (err?.code === "ECONNABORTED") {
    return tv(
      "errors.timeout",
      "Tiempo de espera agotado (15s). El servidor tardó demasiado en responder.",
      "Request timed out (15s). The server took too long to respond."
    );
  }

  // Sin response => red caída, CORS, backend apagado, DNS, etc.
  if (!err?.response) {
    return tv(
      "errors.network",
      "Error de red: no se pudo contactar con el servidor.",
      "Network error: could not reach the server."
    );
  }

  const status = err.response.status;

  // 401 se gestiona en el interceptor (api.js): logout + redirect
  if (status === 401) return "";

  const detail = err.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return `${detail} (HTTP ${status})`;

  return tv(
    "errors.httpGeneric",
    `Error HTTP ${status}: ${err.response.statusText || "Error"}`,
    `HTTP ${status} error: ${err.response.statusText || "Error"}`
  );
}

// Color estable por ID (golden angle)
function accentColorForId(id) {
  const n = Number(id);
  const base = Number.isFinite(n) ? n : 0;
  const hue = (base * 137.508) % 360;
  return `hsl(${hue} 82% 52%)`;
}

/** Icono lineal de dron (quad) con cuerpo central relleno */
function DroneGlyph({ color }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none">
      <rect x="10.1" y="10.1" width="3.8" height="3.8" rx="1" fill={color} opacity="0.35" />
      <circle cx="12" cy="12" r="0.9" fill={color} opacity="0.55" />

      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <circle cx="5.5" cy="5.5" r="2.2" />
        <circle cx="18.5" cy="5.5" r="2.2" />
        <circle cx="5.5" cy="18.5" r="2.2" />
        <circle cx="18.5" cy="18.5" r="2.2" />

        <path d="M7.2 7.2L10.2 10.2" />
        <path d="M16.8 7.2L13.8 10.2" />
        <path d="M7.2 16.8L10.2 13.8" />
        <path d="M16.8 16.8L13.8 13.8" />

        <rect x="10.2" y="10.2" width="3.6" height="3.6" rx="0.9" />
        <path d="M12 9.2v1" />
        <path d="M12 13.8v1" />
      </g>
    </svg>
  );
}

function DroneCardLite({ d, loading, onView, labels }) {
  const accent = accentColorForId(d?.id);

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-white/45 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-[5px]" style={{ backgroundColor: accent, opacity: 0.75 }} />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
      />
      <div className="pointer-events-none absolute inset-[10px] rounded-[16px] ring-1 ring-black/10" />
      <div className="pointer-events-none absolute inset-[11px] rounded-[15px] ring-1 ring-white/40" />

      <div
        className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.18 }}
      />

      <div className="pointer-events-none absolute right-3 top-3 opacity-60">
        <DroneGlyph color={accent} />
      </div>

      <div className="relative p-4">
        <div className="min-w-0 pr-10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.85 }} aria-hidden="true" />
            <span className="font-semibold">#{d.id}</span>
          </div>

          <div className="mt-1 truncate text-lg font-extrabold leading-tight">{d.name || "—"}</div>

          {d.comment ? (
            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.comment}</div>
          ) : (
            <div className="mt-1 text-sm text-muted-foreground">{labels.noComment}</div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={onView} disabled={loading}>
            {labels.view}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HomeLogged() {
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");
  const L = (es, en) => (isEn ? en : es);
  const tv = (key, es, en, opts = {}) => t(key, { defaultValue: L(es, en), ...opts });

  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [lastUpdated, setLastUpdated] = useState(null);

  function setError(text) {
    if (text) setMsg({ type: "error", text });
  }
  function clearMsg() {
    setMsg({ type: "", text: "" });
  }

  async function fetchDrones() {
    setLoading(true);
    clearMsg();

    try {
      const res = await api.get("/drones");
      const arr = Array.isArray(res.data) ? res.data : [];
      arr.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
      setDrones(arr);
      setLastUpdated(new Date());
    } catch (err) {
      if (err?.response?.status === 401) return; // interceptor hace logout + redirect
      setDrones([]);
      setError(buildErrorMessage(err, tv));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive) return;
      await fetchDrones();
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.resolvedLanguage]);

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

  const labels = useMemo(
    () => ({
      view: tv("common.view", "Ver", "View"),
      noComment: tv("homeLogged.noComment", "Sin comentario", "No notes"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.resolvedLanguage]
  );

  const logout = () => {
    clearToken();
    navigate("/", { replace: true });
  };

  return (
    <div className="grid gap-6">
      {/* Header / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 to-white/35" />
        <div className="pointer-events-none absolute inset-0 bg-primary/6 mix-blend-soft-light" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-black/20" />

        <div className="relative grid gap-4 md:grid-cols-[1.6fr_0.9fr] md:items-start">
          <div className="space-y-3">
            <div className="text-xs font-extrabold tracking-wide text-muted-foreground">
              {tv("homeLogged.kicker", "Zona privada", "Private area")}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight">
              {tv("homeLogged.title", "Tu Hangar", "Your Hangar")}
            </h1>

            <p className="text-sm text-muted-foreground">
              {tv(
                "homeLogged.subtitle",
                "Vista rápida (solo lectura) para encontrar drones y abrir su ficha. Para crear/editar/borrar usa Gestión.",
                "Quick read-only view to find drones and open their profile. Use Manage to create/edit/delete."
              )}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button onClick={() => navigate("/manage")}>
                {tv("homeLogged.cta.manage", "Ir a Gestión", "Go to Manage")}
              </Button>
              <Button variant="outline" onClick={logout}>
                {tv("homeLogged.cta.logout", "Cerrar sesión", "Sign out")}
              </Button>
              <Button variant="outline" onClick={fetchDrones} disabled={loading}>
                {loading ? tv("common.loadingBtn", "Cargando...", "Loading...") : tv("common.reload", "Recargar", "Reload")}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {tv(
                "homeLogged.tip",
                "Tip: puedes buscar por texto o por #id (por ejemplo: #3).",
                "Tip: you can search by text or by #id (for example: #3)."
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-white/45 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="text-xs font-extrabold tracking-wide text-muted-foreground/90">
                {tv("homeLogged.stats.kicker", "Resumen", "Summary")}
              </div>

              <div className="mt-2 grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">{tv("homeLogged.stats.total", "Drones", "Drones")}</span>
                  <span className="rounded-xl bg-black/5 px-2 py-1 text-xs font-extrabold text-foreground ring-1 ring-black/10">
                    {drones.length}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs">{tv("homeLogged.stats.updated", "Actualizado", "Updated")}</span>
                  <span className="text-xs font-semibold text-foreground/80">
                    {lastUpdated ? lastUpdated.toLocaleString() : "—"}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs">
                {tv(
                  "homeLogged.stats.note",
                  "Esta pantalla evita acciones peligrosas. La edición/borrado está en Gestión.",
                  "This screen avoids risky actions. Editing/deleting is in Manage."
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      {msg?.text ? <MessageBanner msg={msg} /> : null}

      {/* Buscador */}
      <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <Input
            label={tv("homeLogged.search.label", "Buscar", "Search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tv(
              "homeLogged.search.placeholder",
              "Nombre, comentario… (ej: cinewhoop o #1)",
              "Name, notes… (e.g. cinewhoop or #1)"
            )}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setQuery("")} disabled={!query.trim()}>
              {tv("common.clear", "Limpiar", "Clear")}
            </Button>
            <Button onClick={() => navigate("/manage")}>
              {tv("homeLogged.search.ctaManage", "Crear/editar en Gestión", "Create/edit in Manage")}
            </Button>
          </div>
        </div>

        {/* Listado */}
        <div className="mt-5">
          {loading ? (
            <div className="text-sm text-muted-foreground">{tv("common.loading", "Cargando…", "Loading…")}</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {query.trim()
                ? tv("homeLogged.empty.noResults", "No hay resultados para esa búsqueda.", "No results for that search.")
                : tv("homeLogged.empty.noDrones", "No hay drones para mostrar. Crea el primero en Gestión.", "No drones to display. Create your first one in Manage.")}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((d) => (
                <DroneCardLite
                  key={d.id}
                  d={d}
                  loading={loading}
                  labels={labels}
                  onView={() => navigate(`/drones/${d.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
