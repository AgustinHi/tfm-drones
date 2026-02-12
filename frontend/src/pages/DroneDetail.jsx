// frontend/src/pages/DroneDetail.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import { useTranslation } from "react-i18next";

const CONTROLLERS = ["", "Betaflight", "Kiss"];
const VIDEOS = ["", "Analogico", "Digital"];

/**
 * Backend (según tu Swagger):
 * - GET  /drones/{drone_id}/dumps   -> listar dumps del dron
 * - POST /dumps                    -> subir dump (multipart)
 *
 * Nota: para evitar fallo por nombres de campos distintos, enviamos variantes:
 * - file + dump_file (binary)
 * - drone_id + droneId (string)
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

function Select({ label, value, onChange, options, getOptionLabel }) {
  const labelFor = (x) => {
    if (x === "") return "—";
    return getOptionLabel ? getOptionLabel(x) : x;
  };

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
              {labelFor(x)}
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

  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");

  const tv = useCallback(
    (key, es, en, opts = {}) =>
      t(key, {
        defaultValue: isEn ? en : es,
        ...opts,
      }),
    [t, isEn]
  );

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
  const dumpInputRef = useRef(null);

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
    if (loading) return tv("common.loading", "Cargando…", "Loading…");
    if (!drone) return tv("detail.error.notLoaded", "No se pudo cargar el dron", "Could not load the drone");
    return isEditing
      ? tv("detail.subtitle.editing", "Editando características", "Editing details")
      : tv("detail.subtitle.readonly", "Vista (solo lectura)", "View (read-only)");
  }, [loading, drone, isEditing, tv]);

  async function fetchDrone() {
    clearMsg();
    setLoading(true);
    try {
      const res = await api.get(`/drones/${droneId}`);
      setDrone(res.data);
      fillFormFromDrone(res.data);
    } catch (err) {
      if (!err?.response) setError(tv("errors.network", "Error de red: no se pudo contactar con el servidor.", "Network error: could not reach the server."));
      else setError(err?.response?.data?.detail || tv("detail.error.loading", "Error cargando el dron.", "Error loading the drone."));
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
      setDumpError(err?.response?.data?.detail || tv("detail.dumps.errorList", "No se pudo cargar la lista de dumps.", "Could not load dumps list."));
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
    if (!form.name.trim()) return setError(tv("detail.validation.name", "El nombre es obligatorio.", "Name is required."));

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
      setOk(tv("detail.save.ok", "Guardado correctamente.", "Saved successfully."));
    } catch (err) {
      if (!err?.response) setError(tv("errors.network", "Error de red: no se pudo contactar con el servidor.", "Network error: could not reach the server."));
      else setError(err?.response?.data?.detail || tv("detail.save.error", "Error guardando el dron.", "Error saving the drone."));
    } finally {
      setLoading(false);
    }
  };

  function extractApiError(err, fallback) {
    if (!err) return fallback;
    if (!err.response) return tv("errors.network", "Error de red: no se pudo contactar con el servidor.", "Network error: could not reach the server.");

    const data = err.response.data;
    if (typeof data === "string" && data.trim()) return data;

    const detail = data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;

    if (Array.isArray(detail) && detail.length) {
      // típico 422 de FastAPI: lista de errores
      const defaultItemMsg = tv("errors.validationItem", "Error de validación", "Validation error");

      const lines = detail
        .map((x) => {
          const loc = Array.isArray(x?.loc) ? x.loc.join(".") : "";
          const msg = x?.msg || defaultItemMsg;
          return loc ? `${loc}: ${msg}` : msg;
        })
        .slice(0, 6);

      return tv(
        "errors.validationList",
        `Error de validación (422):\n${lines.join("\n")}`,
        `Validation error (422):\n${lines.join("\n")}`
      );
    }

    return fallback;
  }

  async function uploadDump(e) {
    e.preventDefault();
    clearDumpMsg();

    if (!dumpFile) {
      setDumpError(tv("detail.dumps.pickFile", "Selecciona un archivo primero.", "Pick a file first."));
      return;
    }

    try {
      setDumpBusy(true);

      const fd = new FormData();

      // Variantes de nombre (evita fallo si el backend usa otro campo)
      fd.append("file", dumpFile);
      fd.append("dump_file", dumpFile);

      fd.append("drone_id", String(droneId));
      fd.append("droneId", String(droneId));

      await api.post(API_UPLOAD_DUMP(), fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDumpOk(tv("detail.dumps.uploadOk", "Dump subido correctamente.", "Dump uploaded successfully."));
      setDumpFile(null);
      if (dumpInputRef.current) dumpInputRef.current.value = "";
      await fetchDumps();
    } catch (err) {
      setDumpError(extractApiError(err, tv("detail.dumps.uploadError", "No se pudo subir el dump.", "Could not upload the dump.")));
    } finally {
      setDumpBusy(false);
    }
  }

  const readFields = useMemo(() => {
    const d = drone || {};
    return [
      { label: tv("detail.fields.name", "Nombre", "Name"), value: d.name },
      { label: tv("detail.fields.controller", "Controladora", "Flight controller"), value: d.controller },
      { label: tv("detail.fields.video", "Vídeo", "Video"), value: d.video },
      { label: tv("detail.fields.radio", "Radio", "Radio"), value: d.radio },
      { label: tv("detail.fields.components", "Componentes", "Components"), value: d.components },
      { label: tv("detail.fields.comment", "Comentario", "Notes"), value: d.comment, wide: true },
    ];
  }, [drone, tv]);

  const hasAnyField = useMemo(() => {
    return readFields.some((f) => {
      const v = f.value;
      if (v == null) return false;
      return String(v).trim().length > 0;
    });
  }, [readFields]);

  const videoOptionLabel = (v) => {
    if (v === "Analogico") return tv("detail.video.analog", "Analógico", "Analog");
    if (v === "Digital") return tv("detail.video.digital", "Digital", "Digital");
    return v;
  };

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
                <span
                  className="inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: accent, opacity: 0.85 }}
                  aria-hidden="true"
                />
                <h1 className="text-4xl font-extrabold tracking-tight">
                  {tv("detail.header.title", "Dron #{{id}}", "Drone #{{id}}", { id: droneId })}
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pr-16">
              <Button variant="outline" onClick={() => navigate("/manage")}>
                {tv("detail.actions.backManage", "Volver a Gestión", "Back to Manage")}
              </Button>

              <Button variant="outline" onClick={fetchDrone} disabled={loading}>
                {loading ? tv("common.loadingBtn", "Cargando...", "Loading...") : tv("common.reload", "Recargar", "Reload")}
              </Button>

              {!isEditing ? (
                <Button onClick={startEdit} disabled={loading || !drone}>
                  {tv("common.edit", "Editar", "Edit")}
                </Button>
              ) : (
                <>
                  <Button onClick={save} disabled={loading}>
                    {tv("common.save", "Guardar", "Save")}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                    {tv("common.cancel", "Cancelar", "Cancel")}
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
        <Card title={tv("common.loadingTitle", "Cargando", "Loading")} className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <p className="text-sm text-muted-foreground">{tv("common.loading", "Cargando…", "Loading…")}</p>
        </Card>
      ) : !drone ? (
        <Card title={tv("common.errorTitle", "Error", "Error")} className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <p className="text-sm text-muted-foreground">{tv("detail.error.notLoaded", "No se pudo cargar el dron.", "Could not load the drone.")}</p>
        </Card>
      ) : (
        <>
          {!isEditing ? (
            <>
              {/* Vista */}
              <Card title={tv("detail.view.title", "Vista", "View")} className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
                {!hasAnyField ? (
                  <p className="text-sm text-muted-foreground">
                    {tv(
                      "detail.view.empty",
                      "Este dron aún no tiene características rellenadas.",
                      "This drone doesn't have any details filled in yet."
                    )}
                  </p>
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
              <Card title={tv("detail.dumps.title", "Dumps", "Dumps")} className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
                <div className="grid gap-4">
                  <MessageBanner msg={dumpMsg} />

                  <form onSubmit={uploadDump} className="grid gap-3">
                    <label className="grid gap-1">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {tv("detail.dumps.uploadLabel", "Subir dump", "Upload dump")}
                      </span>
                      <input
                        ref={dumpInputRef}
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
                        {dumpBusy ? tv("detail.dumps.uploading", "Subiendo...", "Uploading...") : tv("detail.dumps.uploadBtn", "Subir", "Upload")}
                      </Button>

                      <Button type="button" variant="outline" onClick={fetchDumps} disabled={dumpBusy}>
                        {tv("detail.dumps.reload", "Recargar dumps", "Reload dumps")}
                      </Button>
                    </div>
                  </form>

                  {dumps.length === 0 ? (
                    <div className="rounded-2xl bg-white/45 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                      {tv("detail.dumps.empty", "No hay dumps todavía.", "No dumps yet.")}
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
                                  {tv("detail.dumps.parse", "Parsear", "Parse")}
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
            <Card
              title={tv("detail.edit.title", "Editar características", "Edit details")}
              className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label={tv("detail.fields.name", "Nombre", "Name")}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={tv("detail.placeholders.name", "Nombre del dron", "Drone name")}
                  required
                />

                <Select
                  label={tv("detail.fields.controller", "Controladora", "Flight controller")}
                  value={form.controller}
                  onChange={(e) => setForm((f) => ({ ...f, controller: e.target.value }))}
                  options={CONTROLLERS}
                />

                <Select
                  label={tv("detail.fields.video", "Vídeo", "Video")}
                  value={form.video}
                  onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))}
                  options={VIDEOS}
                  getOptionLabel={videoOptionLabel}
                />

                <Input
                  label={tv("detail.fields.radio", "Radio", "Radio")}
                  value={form.radio}
                  onChange={(e) => setForm((f) => ({ ...f, radio: e.target.value }))}
                  placeholder={tv("detail.placeholders.radio", "ELRS / Crossfire / etc.", "ELRS / Crossfire / etc.")}
                />

                <Input
                  label={tv("detail.fields.components", "Componentes", "Components")}
                  value={form.components}
                  onChange={(e) => setForm((f) => ({ ...f, components: e.target.value }))}
                  placeholder={tv("detail.placeholders.components", "Motores, FC, ESC…", "Motors, FC, ESC…")}
                />

                <label className="grid gap-1 md:col-span-2">
                  <span className="text-sm font-semibold text-muted-foreground">{tv("detail.fields.comment", "Comentario", "Notes")}</span>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder={tv("detail.placeholders.notes", "Notas", "Notes")}
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
