// frontend/src/pages/DroneDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const CONTROLLERS = ["", "Betaflight", "Kiss"];
const VIDEOS = ["", "Analogico", "Digital"];

/**
 * Backend (según tu Swagger):
 * - GET  /drones/{drone_id}/dumps   -> listar dumps del dron
 * - POST /dumps                    -> subir dump (multipart)
 *
 * Asunción mínima (ajustable en 1 línea si tu backend usa otros nombres):
 * - multipart field: "file"
 * - drone id field: "drone_id"
 */
const API_LIST_DUMPS = (droneId) => `/drones/${droneId}/dumps`;
const API_UPLOAD_DUMP = () => `/dumps`;
const PARSE_ROUTE = (droneId, dumpId) => `/drones/${droneId}/dumps/${dumpId}/parse`;

function accentColorForId(id) {
  const n = Number(id);
  const base = Number.isFinite(n) ? n : 0;
  const hue = (base * 137.508) % 360;
  return `hsl(${hue} 82% 52%)`;
}

function DroneGlyph({ color }) {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none">
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

function ReadField({ label, value }) {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;

  return (
    <div className="grid gap-1">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="rounded-xl bg-white/45 px-3 py-2 text-sm shadow-sm backdrop-blur-xl ring-1 ring-black/10">
        {text}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>

      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={[
            "h-11 w-full appearance-none rounded-xl bg-white/45 backdrop-blur-xl px-3 pr-10 text-sm shadow-sm",
            "ring-1 ring-black/10",
            "transition-all",
            "hover:ring-black/15",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          ].join(" ")}
        >
          {options.map((x) => (
            <option key={x} value={x}>
              {x === "" ? "—" : x}
            </option>
          ))}
        </select>

        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </label>
  );
}

export default function DroneDetail() {
  const navigate = useNavigate();
  const { droneId } = useParams();

  const accent = accentColorForId(droneId);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [drone, setDrone] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    comment: "",
    controller: "",
    video: "",
    radio: "",
    components: "",
  });

  // Dumps (solo en vista)
  const [dumps, setDumps] = useState([]);
  const [dumpBusy, setDumpBusy] = useState(false);
  const [dumpFile, setDumpFile] = useState(null);
  const [dumpMsg, setDumpMsg] = useState({ type: "", text: "" });

  const setError = (text) => setMsg({ type: "error", text });
  const setOk = (text) => setMsg({ type: "ok", text });
  const clearMsg = () => setMsg({ type: "", text: "" });

  const setDumpError = (text) => setDumpMsg({ type: "error", text });
  const setDumpOk = (text) => setDumpMsg({ type: "ok", text });
  const clearDumpMsg = () => setDumpMsg({ type: "", text: "" });

  const fillFormFromDrone = (d) => {
    setForm({
      name: d?.name ?? "",
      comment: d?.comment ?? "",
      controller: d?.controller ?? "",
      video: d?.video ?? "",
      radio: d?.radio ?? "",
      components: d?.components ?? "",
    });
  };

  const subtitle = useMemo(() => {
    if (loading) return "Cargando…";
    if (!drone) return "No se pudo cargar el dron";
    return isEditing ? "Editando características" : "Vista (solo lectura)";
  }, [loading, drone, isEditing]);

  async function fetchDrone() {
    clearMsg();
    setLoading(true);
    try {
      const res = await api.get(`/drones/${droneId}`);
      setDrone(res.data);
      fillFormFromDrone(res.data);
    } catch (err) {
      if (!err?.response) setError("Error de red: no se pudo contactar con el servidor.");
      else setError(err?.response?.data?.detail || "Error cargando el dron.");
      setDrone(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDumps() {
    clearDumpMsg();
    try {
      const res = await api.get(API_LIST_DUMPS(droneId));
      const arr = Array.isArray(res.data) ? res.data : [];
      // robusto: created_at si existe; si no, por id desc
      arr.sort((a, b) => {
        const ad = a?.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b?.created_at ? new Date(b.created_at).getTime() : 0;
        if (bd !== ad) return bd - ad;
        return (b?.id ?? 0) - (a?.id ?? 0);
      });
      setDumps(arr);
    } catch (err) {
      setDumps([]);
      setDumpError(err?.response?.data?.detail || "No se pudo cargar la lista de dumps.");
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await fetchDrone();
      await fetchDumps();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [droneId]);

  const startEdit = () => {
    if (!drone) return;
    clearMsg();
    setIsEditing(true);
    fillFormFromDrone(drone);
  };

  const cancelEdit = () => {
    if (!drone) return;
    clearMsg();
    setIsEditing(false);
    fillFormFromDrone(drone);
  };

  const save = async () => {
    clearMsg();
    if (!form.name.trim()) return setError("El nombre es obligatorio.");

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        comment: form.comment?.trim() ? form.comment.trim() : null,
        controller: form.controller?.trim() ? form.controller.trim() : null,
        video: form.video?.trim() ? form.video.trim() : null,
        radio: form.radio?.trim() ? form.radio.trim() : null,
        components: form.components?.trim() ? form.components.trim() : null,
      };

      const res = await api.put(`/drones/${droneId}`, payload);
      setDrone(res.data);
      fillFormFromDrone(res.data);
      setIsEditing(false);
      setOk("Guardado correctamente.");
    } catch (err) {
      if (!err?.response) setError("Error de red: no se pudo contactar con el servidor.");
      else setError(err?.response?.data?.detail || "Error guardando el dron.");
    } finally {
      setLoading(false);
    }
  };

  async function uploadDump(e) {
    e.preventDefault();
    clearDumpMsg();

    if (!dumpFile) {
      setDumpError("Selecciona un archivo primero.");
      return;
    }

    try {
      setDumpBusy(true);

      const fd = new FormData();
      fd.append("file", dumpFile);
      fd.append("drone_id", String(droneId));

      await api.post(API_UPLOAD_DUMP(), fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDumpOk("Dump subido correctamente.");
      setDumpFile(null);
      await fetchDumps();
    } catch (err) {
      setDumpError(err?.response?.data?.detail || "No se pudo subir el dump.");
    } finally {
      setDumpBusy(false);
    }
  }

  const readFields = useMemo(() => {
    const d = drone || {};
    return [
      { label: "Nombre", value: d.name },
      { label: "Controladora", value: d.controller },
      { label: "Vídeo", value: d.video },
      { label: "Radio", value: d.radio },
      { label: "Componentes", value: d.components },
      { label: "Comentario", value: d.comment, wide: true },
    ];
  }, [drone]);

  const hasAnyField = useMemo(() => {
    return readFields.some((f) => {
      const v = f.value;
      if (v == null) return false;
      return String(v).trim().length > 0;
    });
  }, [readFields]);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[22px] bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-[5px]" style={{ backgroundColor: accent, opacity: 0.75 }} />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
        />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-primary/4" />
        <div className="pointer-events-none absolute inset-[12px] rounded-[16px] ring-1 ring-black/10" />
        <div className="pointer-events-none absolute inset-[13px] rounded-[15px] ring-1 ring-white/40" />
        <div
          className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: accent, opacity: 0.16 }}
        />

        <div className="pointer-events-none absolute right-4 top-4 opacity-60">
          <DroneGlyph color={accent} />
        </div>

        <div className="relative p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 pr-16">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent, opacity: 0.85 }} aria-hidden="true" />
                <h1 className="text-4xl font-extrabold tracking-tight">Dron #{droneId}</h1>
              </div>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pr-16">
              <Button variant="outline" onClick={() => navigate("/manage")}>
                Volver a Gestión
              </Button>

              <Button variant="outline" onClick={fetchDrone} disabled={loading}>
                {loading ? "Cargando..." : "Recargar"}
              </Button>

              {!isEditing ? (
                <Button onClick={startEdit} disabled={loading || !drone}>
                  Editar
                </Button>
              ) : (
                <>
                  <Button onClick={save} disabled={loading}>
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <MessageBanner msg={msg} />

      {/* Body */}
      {loading ? (
        <Card title="Cargando" className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <p className="text-sm text-muted-foreground">Cargando…</p>
        </Card>
      ) : !drone ? (
        <Card title="Error" className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <p className="text-sm text-muted-foreground">No se pudo cargar el dron.</p>
        </Card>
      ) : (
        <>
          {!isEditing ? (
            <>
              {/* Vista */}
              <Card title="Vista" className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
                {!hasAnyField ? (
                  <p className="text-sm text-muted-foreground">Este dron aún no tiene características rellenadas.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {readFields.map((f) =>
                      f.wide ? (
                        <div key={f.label} className="md:col-span-2">
                          <ReadField label={f.label} value={f.value} />
                        </div>
                      ) : (
                        <ReadField key={f.label} label={f.label} value={f.value} />
                      )
                    )}
                  </div>
                )}
              </Card>

              {/* Dumps */}
              <Card title="Dumps" className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
                <div className="grid gap-4">
                  <MessageBanner msg={dumpMsg} />

                  <form onSubmit={uploadDump} className="grid gap-3">
                    <label className="grid gap-1">
                      <span className="text-sm font-semibold text-muted-foreground">Subir dump</span>
                      <input
                        type="file"
                        onChange={(e) => setDumpFile(e.target.files?.[0] || null)}
                        className={[
                          "w-full rounded-xl bg-white/45 px-3 py-2 text-sm shadow-sm backdrop-blur-xl",
                          "ring-1 ring-black/10",
                        ].join(" ")}
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" disabled={dumpBusy}>
                        {dumpBusy ? "Subiendo..." : "Subir"}
                      </Button>

                      <Button type="button" variant="outline" onClick={fetchDumps} disabled={dumpBusy}>
                        Recargar dumps
                      </Button>
                    </div>
                  </form>

                  {dumps.length === 0 ? (
                    <div className="rounded-2xl bg-white/45 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                      No hay dumps todavía.
                    </div>
                  ) : (
                    <ul className="divide-y divide-black/10 rounded-2xl bg-white/45 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                      {dumps.map((x) => {
                        const dumpId = x?.id ?? x?.dump_id ?? x?.uuid ?? x?._id ?? "";
                        const filename = x?.filename || x?.name || (dumpId ? `Dump #${dumpId}` : "Dump");
                        const created = x?.created_at ? new Date(x.created_at).toLocaleString() : null;

                        return (
                          <li key={String(dumpId) || filename} className="px-4 py-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-extrabold">{filename}</div>
                                <div className="mt-0.5 text-xs text-muted-foreground">{created ? created : "—"}</div>
                              </div>

                              <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <Button onClick={() => navigate(PARSE_ROUTE(droneId, dumpId))} disabled={!dumpId}>
                                  Parsear
                                </Button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </Card>
            </>
          ) : (
            /* Editar (sin dumps) */
            <Card title="Editar características" className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Nombre"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre del dron"
                  required
                />

                <Select
                  label="Controladora"
                  value={form.controller}
                  onChange={(e) => setForm((f) => ({ ...f, controller: e.target.value }))}
                  options={CONTROLLERS}
                />

                <Select
                  label="Vídeo"
                  value={form.video}
                  onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))}
                  options={VIDEOS}
                />

                <Input
                  label="Radio"
                  value={form.radio}
                  onChange={(e) => setForm((f) => ({ ...f, radio: e.target.value }))}
                  placeholder="ELRS / Crossfire / etc."
                />

                <Input
                  label="Componentes"
                  value={form.components}
                  onChange={(e) => setForm((f) => ({ ...f, components: e.target.value }))}
                  placeholder="Motores, FC, ESC…"
                />

                <label className="grid gap-1 md:col-span-2">
                  <span className="text-sm font-semibold text-muted-foreground">Comentario</span>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Notas"
                    rows={4}
                    className={[
                      "w-full rounded-xl bg-white/45 backdrop-blur-xl px-3 py-2 text-sm shadow-sm",
                      "ring-1 ring-black/10",
                      "transition-all placeholder:text-muted-foreground/70",
                      "hover:ring-black/15",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    ].join(" ")}
                  />
                </label>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
