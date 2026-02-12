import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

function buildErrorMessage(err) {
  if (!err?.response) return "Error de red: no se pudo contactar con el servidor.";
  const status = err.response.status;
  if (status === 401) return "No autorizado (401). Tu sesión no es válida o ha caducado.";
  const detail = err.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return `${detail} (HTTP ${status})`;
  return `Error HTTP ${status}: ${err.response.statusText || "Error"}`;
}

// Color estable por ID (golden angle)
function accentColorForId(id) {
  const n = Number(id);
  const base = Number.isFinite(n) ? n : 0;
  const hue = (base * 137.508) % 360;
  return `hsl(${hue} 82% 52%)`;
}

function MessageBanner({ msg }) {
  if (!msg?.text) return null;
  const ok = msg.type === "ok";

  return (
    <div
      className={[
        "rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur-xl ring-1",
        ok
          ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-200"
          : "bg-destructive/10 text-destructive ring-destructive/20",
      ].join(" ")}
    >
      {msg.text}
    </div>
  );
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

function DroneCard({ d, loading, onView, onDelete }) {
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

      {/* Detalles técnicos */}
      <div className="pointer-events-none absolute right-10 top-0 h-10 w-px bg-black/10" />
      <div className="pointer-events-none absolute right-0 top-10 h-px w-10 bg-black/10" />

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
              <span className="font-semibold">#{d.id}</span>
            </div>

            <div className="mt-1 truncate text-lg font-extrabold leading-tight pr-10">{d.name || "—"}</div>

            {d.comment ? (
              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.comment}</div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">Sin comentario</div>
            )}
          </div>
        </div>

        {/* Ajuste: menos margen al quitar el bloque inferior */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={onView} disabled={loading}>
            Ver
          </Button>

          <Button
            variant="outline"
            onClick={onDelete}
            disabled={loading}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Borrar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Manage() {
  const navigate = useNavigate();

  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newComment, setNewComment] = useState("");

  const [query, setQuery] = useState("");

  const [msg, setMsg] = useState({ type: "", text: "" });

  function setError(text) {
    setMsg({ type: "error", text });
  }
  function setOk(text) {
    setMsg({ type: "ok", text });
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
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function createDrone(e) {
    e.preventDefault();
    clearMsg();

    const n = newName.trim();
    const c = newComment.trim();
    if (!n) return setError("El Nombre es obligatorio.");

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
      setOk("Dron creado correctamente.");
    } catch (err) {
      setError(buildErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function deleteDrone(d) {
    clearMsg();

    const expected = `BORRAR #${d.id}`;
    const typed = window.prompt(
      `Para borrar este dron escribe exactamente:\n\n${expected}\n\nDron: ${d.name || "—"}`
    );

    if (typed == null) return;
    if (typed.trim() !== expected) {
      setError(`Cancelado. Debes escribir exactamente: ${expected}`);
      return;
    }

    setLoading(true);
    try {
      await api.delete(`/drones/${d.id}`);
      setDrones((prev) => prev.filter((x) => x.id !== d.id));
      setOk("Dron eliminado.");
    } catch (err) {
      setError(buildErrorMessage(err));
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

  return (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-primary/4" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">Gestión</h1>
            <p className="text-sm text-muted-foreground">Crear drones y gestionar tarjetas (zona privada)</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={fetchDrones} disabled={loading}>
              {loading ? "Cargando..." : "Recargar"}
            </Button>
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-xs text-muted-foreground">Total drones</div>
            <div className="text-2xl font-extrabold">{drones.length}</div>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10 sm:col-span-2">
            <div className="text-xs text-muted-foreground">Búsqueda</div>
            <div className="text-sm text-muted-foreground">
              Escribe <span className="font-bold text-foreground">#3</span> para filtrar por ID o texto como{" "}
              <span className="font-bold text-foreground">cinewhoop</span>.
            </div>
          </div>
        </div>
      </div>

      <MessageBanner msg={msg} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="grid gap-4 lg:col-span-2">
          <Card
            title={`Drones (${filtered.length}/${drones.length})`}
            className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
          >
            <div className="grid gap-4">
              <Input
                label="Buscar"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre, comentario… (ej: #3 o 'cinewhoop')"
              />

              {filtered.length === 0 ? (
                <div className="rounded-2xl bg-white/45 p-5 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <p className="text-sm text-muted-foreground">
                    {query.trim() ? "No hay resultados para esa búsqueda." : "No hay drones creados todavía."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filtered.map((d) => (
                    <DroneCard
                      key={d.id}
                      d={d}
                      loading={loading}
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
          <Card title="Crear dron" className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
            <form onSubmit={createDrone} className="grid gap-3">
              <Input
                label="Nombre"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Cinewhoop 2.5"
                autoComplete="off"
              />
              <Input
                label="Comentario (opcional)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ej: Setup indoor / vídeo digital…"
                autoComplete="off"
              />

              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear"}
              </Button>

              <div className="rounded-2xl bg-white/45 p-4 text-xs text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                Consejo: usa un nombre claro para evitar confusiones. Borrar exige confirmación estricta.
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
