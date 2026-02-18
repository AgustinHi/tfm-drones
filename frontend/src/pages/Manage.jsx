// frontend/src/pages/Manage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Button from "../ui/Button";
import Card from "../ui/Card";
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
  if (status === 401) {
    return ""; // evitamos “flash” de mensaje antes del redirect
  }

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
      {/* Cuerpo central relleno */}
      <rect x="10.1" y="10.1" width="3.8" height="3.8" rx="1" fill={color} opacity="0.35" />
      <circle cx="12" cy="12" r="0.9" fill={color} opacity="0.55" />

      <g fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        {/* rotores */}
        <circle cx="5.5" cy="5.5" r="2.2" />
        <circle cx="18.5" cy="5.5" r="2.2" />
        <circle cx="5.5" cy="18.5" r="2.2" />
        <circle cx="18.5" cy="18.5" r="2.2" />

        {/* brazos */}
        <path d="M7.2 7.2L10.2 10.2" />
        <path d="M16.8 7.2L13.8 10.2" />
        <path d="M7.2 16.8L10.2 13.8" />
        <path d="M16.8 16.8L13.8 13.8" />

        {/* cuerpo (contorno) */}
        <rect x="10.2" y="10.2" width="3.6" height="3.6" rx="0.9" />
        <path d="M12 9.2v1" />
        <path d="M12 13.8v1" />
      </g>
    </svg>
  );
}

function DroneCard({ d, loading, onView, onDelete, labels }) {
  const accent = accentColorForId(d?.id);

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-white/45 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
      {/* Acento lateral */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-[5px]" style={{ backgroundColor: accent, opacity: 0.75 }} />

      {/* Hairline superior con color */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
      />

      {/* “Hardware frame” interior */}
      <div className="pointer-events-none absolute inset-[10px] rounded-[16px] ring-1 ring-black/10" />
      <div className="pointer-events-none absolute inset-[11px] rounded-[15px] ring-1 ring-white/40" />

      {/* Glow suave */}
      <div
        className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.18 }}
      />

      {/* Insignia dron */}
      <div className="pointer-events-none absolute right-3 top-3 opacity-60">
        <DroneGlyph color={accent} />
      </div>

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: accent, opacity: 0.85 }}
                aria-hidden="true"
              />
            </div>

            <div className="mt-1 truncate text-lg font-extrabold leading-tight pr-10">{d.name || "—"}</div>

            {d.comment ? (
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.comment}</div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">{labels.noComment}</div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={onView} disabled={loading}>
            {labels.view}
          </Button>

          <Button
            variant="outline"
            onClick={onDelete}
            disabled={loading}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {labels.delete}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Manage() {
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");
  const L = (es, en) => (isEn ? en : es);
  const tv = (key, es, en, opts = {}) => t(key, { defaultValue: L(es, en), ...opts });

  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newComment, setNewComment] = useState("");

  const [query, setQuery] = useState("");

  const [msg, setMsg] = useState({ type: "", text: "" });

  function setError(text) {
    if (text) setMsg({ type: "error", text });
  }
  function setOk(text) {
    if (text) setMsg({ type: "ok", text });
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
    } catch (err) {
      // 401: el interceptor ya hace logout + redirect
      if (err?.response?.status === 401) return;

      setError(buildErrorMessage(err, tv));
    } finally {
      setLoading(false);
    }
  }

  async function createDrone(e) {
    e.preventDefault();
    clearMsg();

    const n = newName.trim();
    const c = newComment.trim();
    if (!n) return setError(tv("manage.create.nameRequired", "El Nombre es obligatorio.", "Name is required."));

    setLoading(true);
    try {
      const payload = {
        name: n,
        comment: c ? c : null,
        controller: null,
        video: null,
        radio: null,
        components: null,
      };

      const res = await api.post("/drones", payload);
      setDrones((prev) => [res.data, ...prev]);
      setNewName("");
      setNewComment("");
      setOk(tv("manage.create.success", "Dron creado correctamente.", "Drone created successfully."));
    } catch (err) {
      // 401: el interceptor ya hace logout + redirect
      if (err?.response?.status === 401) return;

      setError(buildErrorMessage(err, tv));
    } finally {
      setLoading(false);
    }
  }

  async function deleteDrone(d) {
    clearMsg();

    const expected = isEn ? `DELETE #${d.id}` : `BORRAR #${d.id}`;
    const typed = window.prompt(
      tv(
        "manage.delete.prompt",
        "Para borrar este dron escribe exactamente:\n\n{{expected}}\n\nDron: {{name}}",
        "To delete this drone, type exactly:\n\n{{expected}}\n\nDrone: {{name}}",
        { expected, name: d.name || "—" }
      )
    );

    if (typed == null) return;
    if (typed.trim() !== expected) {
      setError(
        tv(
          "manage.delete.cancelled",
          "Cancelado. Debes escribir exactamente: {{expected}}",
          "Cancelled. You must type exactly: {{expected}}",
          { expected }
        )
      );
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/drones/${d.id}`);
      setDrones((prev) => prev.filter((x) => x.id !== d.id));
      setOk(tv("manage.delete.success", "Dron eliminado.", "Drone deleted."));
    } catch (err) {
      // 401: el interceptor ya hace logout + redirect
      if (err?.response?.status === 401) return;

      setError(buildErrorMessage(err, tv));
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const raw = query.trim().toLowerCase();
    const q = raw.startsWith("#") ? raw.slice(1).trim() : raw;

    const base = [...drones];
    if (!q) return base;

    return base.filter((d) => {
      const idText = String(d.id ?? "");
      const text = `${idText} ${d.name ?? ""} ${d.comment ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [drones, query]);

  useEffect(() => {
    fetchDrones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardLabels = {
    view: tv("manage.card.view", "Ver", "View"),
    delete: tv("manage.card.delete", "Borrar", "Delete"),
    noComment: tv("manage.card.noComment", "Sin comentario", "No notes"),
  };

  return (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-primary/4" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">{tv("manage.title", "Gestión", "Manage")}</h1>
            <p className="text-sm text-muted-foreground">
              {tv("manage.subtitle", "Crear drones y gestionar tarjetas (zona privada)", "Create drones and manage cards (private area)")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={fetchDrones} disabled={loading}>
              {loading ? tv("common.loadingBtn", "Cargando...", "Loading...") : tv("common.reload", "Recargar", "Reload")}
            </Button>
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-xs text-muted-foreground">{tv("manage.stats.total", "Total drones", "Total drones")}</div>
            <div className="text-2xl font-extrabold">{drones.length}</div>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10 sm:col-span-2">
            <div className="text-xs text-muted-foreground">{tv("manage.stats.searchTitle", "Búsqueda", "Search")}</div>
            <div className="text-sm text-muted-foreground">
              {tv("manage.stats.searchHelp", "Escribe ", "Type ")}
              <span className="font-bold text-foreground">#3</span>{" "}
              {tv("manage.stats.searchHelp2", "para filtrar por ID o texto como ", "to filter by ID or text like ")}
              <span className="font-bold text-foreground">cinewhoop</span>.
            </div>
          </div>
        </div>
      </div>

      <MessageBanner msg={msg} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card
            title={tv("manage.list.title", "Drones ({{shown}}/{{total}})", "Drones ({{shown}}/{{total}})", {
              shown: filtered.length,
              total: drones.length,
            })}
            className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
          >
            <div className="grid gap-4">
              <Input
                label={tv("home.list.searchLabel", "Buscar", "Search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tv(
                  "manage.list.searchPlaceholder",
                  "Nombre, comentario… (ej: #3 o 'cinewhoop')",
                  "Name, notes… (e.g. #3 or 'cinewhoop')"
                )}
              />

              {filtered.length === 0 ? (
                <div className="rounded-2xl bg-white/45 p-5 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <p className="text-sm text-muted-foreground">
                    {query.trim()
                      ? tv("home.list.noResults", "No hay resultados para esa búsqueda.", "No results for that search.")
                      : tv("manage.list.empty", "No hay drones creados todavía.", "No drones created yet.")}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filtered.map((d) => (
                    <DroneCard
                      key={d.id}
                      d={d}
                      loading={loading}
                      labels={cardLabels}
                      onView={() => navigate(`/drones/${d.id}`)}
                      onDelete={() => deleteDrone(d)}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card
            title={tv("manage.create.title", "Crear dron", "Create drone")}
            className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
          >
            <form onSubmit={createDrone} className="grid gap-3">
              <Input
                label={tv("manage.create.nameLabel", "Nombre", "Name")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={tv("manage.create.namePh", "Ej: Cinewhoop 2.5", "e.g. Cinewhoop 2.5")}
                autoComplete="off"
              />
              <Input
                label={tv("manage.create.commentLabel", "Comentario (opcional)", "Notes (optional)")}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={tv("manage.create.commentPh", "Ej: Setup indoor / vídeo digital…", "e.g. Indoor setup / digital video…")}
                autoComplete="off"
              />

              <Button type="submit" disabled={loading}>
                {loading ? tv("manage.create.creating", "Creando...", "Creating...") : tv("manage.create.submit", "Crear", "Create")}
              </Button>

              <div className="rounded-2xl bg-white/45 p-4 text-xs text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                {tv(
                  "manage.create.tip",
                  "Consejo: usa un nombre claro para evitar confusiones. Borrar exige confirmación estricta.",
                  "Tip: use a clear name to avoid confusion. Deleting requires strict confirmation."
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
