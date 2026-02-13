// frontend/src/pages/DumpParse.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import { useTranslation } from "react-i18next";

const EMPTY_OBJ = Object.freeze({});
const EMPTY_ARR = Object.freeze([]);

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function MessageBanner({ type, text }) {
  if (!text) return null;
  const ok = type === "ok";
  return (
    <div
      className={[
        "rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur-xl ring-1 whitespace-pre-wrap",
        ok
          ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-200"
          : "bg-destructive/10 text-destructive ring-destructive/20",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function ProgressBar({ value }) {
  const v = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10">
      <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.round(v * 100)}%` }} />
    </div>
  );
}

function StatCard({ label, value, sub, progressValue }) {
  return (
    <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value ?? "—"}</div>
      {typeof progressValue === "number" ? <ProgressBar value={progressValue} /> : null}
      {sub ? <div className="mt-2 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function SimpleTable({ columns, rows, emptyLabel }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white/45 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
      <table className="min-w-full text-sm">
        <thead className="border-b border-black/10">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-muted-foreground"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {rows.map((r, idx) => (
            <tr key={idx} className="align-top">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-sm text-foreground/90">
                  {r?.[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KeyValueList({ data, emptyLabel, limit = 120 }) {
  const entries = useMemo(() => {
    if (!data || typeof data !== "object") return [];
    return Object.entries(data);
  }, [data]);

  if (!entries.length) return <div className="text-sm text-muted-foreground">{emptyLabel}</div>;

  const shown = entries.slice(0, limit);
  const hiddenCount = Math.max(0, entries.length - shown.length);

  return (
    <div className="grid gap-2">
      <div className="divide-y divide-black/10 rounded-2xl bg-white/45 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
        {shown.map(([k, v]) => (
          <div key={k} className="grid gap-1 px-4 py-3">
            <div className="text-xs font-semibold text-muted-foreground">{k}</div>
            <div className="text-sm font-extrabold break-words">{String(v)}</div>
          </div>
        ))}
      </div>

      {hiddenCount > 0 ? (
        <div className="text-xs text-muted-foreground">+ {hiddenCount} más (limitado para no romper el layout)</div>
      ) : null}
    </div>
  );
}

function LinesBox({ lines, emptyLabel, limit = 120 }) {
  const arr = Array.isArray(lines) ? lines : [];
  if (arr.length === 0) return <div className="text-sm text-muted-foreground">{emptyLabel}</div>;

  const shown = arr.slice(0, limit);
  const hiddenCount = Math.max(0, arr.length - shown.length);

  return (
    <div className="grid gap-2">
      <div className="rounded-2xl bg-white/45 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
        <pre className="whitespace-pre-wrap break-words">{shown.join("\n")}</pre>
      </div>

      {hiddenCount > 0 ? (
        <div className="text-xs text-muted-foreground">+ {hiddenCount} líneas más (limitado para no romper el layout)</div>
      ) : null}
    </div>
  );
}

function splitTokens(line) {
  return String(line || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// -------------------- Rates chart helpers (best-effort) --------------------
function toNumber(v) {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function pickNumber(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const n = toNumber(obj[k]);
      if (n != null) return n;
    }
  }
  return null;
}

function normExpo(stick01, expo01) {
  const x = Math.min(1, Math.max(0, stick01));
  const e = Math.min(1, Math.max(0, Number.isFinite(expo01) ? expo01 : 0));
  return x * (1 - e) + x * x * x * e;
}

// Aproximación “super-rate” (no 1:1 si el backend no indica rate_type).
function bfSuperRate(stick01, rcRate, superRate, expo01) {
  const x = Math.min(1, Math.max(0, stick01));
  const sr = Math.max(0, Number.isFinite(superRate) ? superRate : 0);
  const rc = Math.max(0, Number.isFinite(rcRate) ? rcRate : 0);

  const expo = normExpo(x, expo01);
  const base = 200 * rc;

  const denom = 1 - sr * expo;
  const factor = denom > 0.02 ? 1 / denom : 50;

  return base * expo * factor;
}

function buildCurve(rcRate, superRate, expo01, steps = 70) {
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = i / steps;
    const y = bfSuperRate(x, rcRate, superRate, expo01);
    pts.push({ x, y });
  }
  return pts;
}

function svgPathFromPoints(points, w, h, pad, maxY) {
  if (!points?.length) return "";
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);
  const clampMax = maxY > 0 ? maxY : 1;

  const mapX = (x) => pad + x * innerW;
  const mapY = (y) => h - pad - (Math.min(clampMax, Math.max(0, y)) / clampMax) * innerH;

  let d = `M ${mapX(points[0].x)} ${mapY(points[0].y)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${mapX(points[i].x)} ${mapY(points[i].y)}`;
  }
  return d;
}

function RatesChart({ axes, title, hint }) {
  const w = 560;
  const h = 220;
  const pad = 18;

  const maxY = useMemo(() => {
    const vals = Object.values(axes || {}).flatMap((a) => (a?.curve || []).map((p) => p.y));
    const m = vals.length ? Math.max(...vals) : 1;
    return Number.isFinite(m) && m > 0 ? m : 1;
  }, [axes]);

  const rollPath = useMemo(
    () => svgPathFromPoints(axes?.roll?.curve || EMPTY_ARR, w, h, pad, maxY),
    [axes, maxY]
  );
  const pitchPath = useMemo(
    () => svgPathFromPoints(axes?.pitch?.curve || EMPTY_ARR, w, h, pad, maxY),
    [axes, maxY]
  );
  const yawPath = useMemo(
    () => svgPathFromPoints(axes?.yaw?.curve || EMPTY_ARR, w, h, pad, maxY),
    [axes, maxY]
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-extrabold">{title}</div>
        {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="220" role="img" aria-label={title} className="block">
          {/* grid */}
          <g opacity="0.35" stroke="currentColor">
            <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} strokeWidth="1" />
            <line x1={pad} y1={pad} x2={pad} y2={h - pad} strokeWidth="1" />
            <line
              x1={pad}
              y1={pad + (h - pad * 2) * 0.33}
              x2={w - pad}
              y2={pad + (h - pad * 2) * 0.33}
              strokeWidth="1"
            />
            <line
              x1={pad}
              y1={pad + (h - pad * 2) * 0.66}
              x2={w - pad}
              y2={pad + (h - pad * 2) * 0.66}
              strokeWidth="1"
            />
            <line
              x1={pad + (w - pad * 2) * 0.5}
              y1={pad}
              x2={pad + (w - pad * 2) * 0.5}
              y2={h - pad}
              strokeWidth="1"
            />
          </g>

          {/* curves
              Nota: roll/pitch/yaw pueden coincidir EXACTAMENTE (mismos rates) -> solo verías la última.
              Para evitarlo y que se vean las 3, pitch y yaw van con dash patterns (tipo "overlay"). */}
          <path
            d={rollPath}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-rose-500"
            opacity="0.95"
          />
          <path
            d={pitchPath}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="8 6"
            className="stroke-emerald-500"
            opacity="0.95"
          />
          <path
            d={yawPath}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="2 7"
            className="stroke-sky-500"
            opacity="0.95"
          />

          {/* labels */}
          <g className="fill-muted-foreground" opacity="0.9">
            <text x={pad} y={h - 6} fontSize="12">
              0
            </text>
            <text x={w - pad - 10} y={h - 6} fontSize="12">
              1
            </text>
            <text x={pad - 6} y={pad + 10} fontSize="12" textAnchor="end">
              {Math.round(maxY)}
            </text>
          </g>
        </svg>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" /> roll
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" /> pitch
            <span className="ml-1 opacity-70">— —</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" aria-hidden="true" /> yaw
            <span className="ml-1 opacity-70">· ·</span>
          </span>
        </div>
      </div>
    </div>
  );
}
// ---------------------------------------------------------------------------

export default function DumpParse() {
  const navigate = useNavigate();
  const { droneId, dumpId } = useParams();

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

  const [busy, setBusy] = useState(true);
  const [banner, setBanner] = useState({ type: "", text: "" });

  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("summary"); // summary | settings | raw
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("0");
  const [selectedRateProfile, setSelectedRateProfile] = useState("0");
  const [selectedGroup, setSelectedGroup] = useState("pid"); // pid|rates|ports|osd|rx|vtx|misc

  const extractApiError = useCallback(
    (err, fallback) => {
      if (!err) return fallback;
      if (!err.response)
        return tv(
          "errors.network",
          "Error de red: no se pudo contactar con el servidor.",
          "Network error: could not reach the server."
        );
      const data = err.response.data;
      if (typeof data === "string" && data.trim()) return data;
      const detail = data?.detail;
      if (typeof detail === "string" && detail.trim()) return detail;
      return fallback;
    },
    [tv]
  );

  const fetchParse = useCallback(async () => {
    setBanner({ type: "", text: "" });
    setBusy(true);

    try {
      const res = await api.get(`/drones/${droneId}/dumps/${dumpId}/parse`);
      setData(res.data);

      const parsedNext = res.data?.parsed ?? EMPTY_OBJ;
      const pKeys = Object.keys(parsedNext?.settings?.profiles ?? EMPTY_OBJ);
      const rKeys = Object.keys(parsedNext?.settings?.rateprofiles ?? EMPTY_OBJ);

      if (pKeys.length) setSelectedProfile((prev) => (pKeys.includes(prev) ? prev : pKeys[0]));
      if (rKeys.length) setSelectedRateProfile((prev) => (rKeys.includes(prev) ? prev : rKeys[0]));
    } catch (err) {
      setData(null);
      setBanner({
        type: "error",
        text: extractApiError(err, tv("dumpParse.error", "No se pudo parsear el dump.", "Could not parse the dump.")),
      });
    } finally {
      setBusy(false);
    }
  }, [droneId, dumpId, extractApiError, tv]);

  useEffect(() => {
    fetchParse();
  }, [fetchParse]);

  const parsed = data?.parsed ?? EMPTY_OBJ;
  const firmware = parsed?.firmware ?? EMPTY_OBJ;
  const warnings = Array.isArray(parsed?.warnings) ? parsed.warnings : EMPTY_ARR;
  const stats = parsed?.stats ?? EMPTY_OBJ;
  const features = parsed?.features ?? EMPTY_OBJ;
  const ports = parsed?.ports ?? EMPTY_OBJ;
  const resources = Array.isArray(parsed?.resources) ? parsed.resources : EMPTY_ARR;
  const modes = parsed?.modes ?? EMPTY_OBJ;
  const settings = parsed?.settings ?? EMPTY_OBJ;
  const otherCommands = Array.isArray(parsed?.other_commands) ? parsed.other_commands : EMPTY_ARR;

  // ---------- “Representación” (tablas) ----------
  const serialRows = useMemo(() => {
    const lines = Array.isArray(ports?.serial) ? ports.serial : EMPTY_ARR;
    return lines
      .map((ln) => {
        const tokens = splitTokens(ln);
        if (tokens[0] !== "serial") return { port: "—", function: "—", baud: "—", raw: ln };

        const portId = tokens[1] ?? "—";
        const functionMask = tokens[2] ?? "—";
        const baud = tokens.slice(3).join(" ");
        return {
          port: portId,
          function: functionMask,
          baud: baud || "—",
          raw: ln,
        };
      })
      .slice(0, 200);
  }, [ports]);

  const auxRows = useMemo(() => {
    const lines = Array.isArray(modes?.aux) ? modes.aux : EMPTY_ARR;
    return lines
      .map((ln) => {
        const tokens = splitTokens(ln);
        if (tokens[0] !== "aux") return { mode: "—", channel: "—", range: "—", raw: ln };

        const modeId = tokens[1] ?? "—";
        const channel = tokens[2] ?? "—";
        const rangeStart = tokens[3] ?? "—";
        const rangeEnd = tokens[4] ?? "—";
        return {
          mode: modeId,
          channel,
          range: `${rangeStart} → ${rangeEnd}`,
          raw: ln,
        };
      })
      .slice(0, 200);
  }, [modes]);

  const resourceRows = useMemo(() => {
    const lines = Array.isArray(resources) ? resources : EMPTY_ARR;
    return lines
      .map((ln) => {
        const tokens = splitTokens(ln);
        if (tokens[0] !== "resource") return { type: "—", index: "—", pin: "—", raw: ln };
        return {
          type: tokens[1] ?? "—",
          index: tokens[2] ?? "—",
          pin: tokens[3] ?? "—",
          raw: ln,
        };
      })
      .slice(0, 400);
  }, [resources]);

  const recognizedRatio = useMemo(() => {
    const total = Number(stats?.lines_total ?? 0);
    const recognized = Number(stats?.recognized ?? 0);
    if (!total || !Number.isFinite(total) || total <= 0) return 0;
    if (!Number.isFinite(recognized) || recognized < 0) return 0;
    return Math.min(1, Math.max(0, recognized / total));
  }, [stats]);

  // ---------- Settings (mejor visual) ----------
  const profileKeys = useMemo(() => {
    const keys = Object.keys(settings?.profiles ?? EMPTY_OBJ);
    return keys.sort((a, b) => (Number(a) || 0) - (Number(b) || 0));
  }, [settings]);

  const rateProfileKeys = useMemo(() => {
    const keys = Object.keys(settings?.rateprofiles ?? EMPTY_OBJ);
    return keys.sort((a, b) => (Number(a) || 0) - (Number(b) || 0));
  }, [settings]);

  const groupOptions = useMemo(
    () => [
      { key: "pid", label: tv("dumpParse.groups.pid", "PID / Filtros", "PID / Filters") },
      { key: "rates", label: tv("dumpParse.groups.rates", "Rates", "Rates") },
      { key: "ports", label: tv("dumpParse.groups.ports", "Ports", "Ports") },
      { key: "rx", label: tv("dumpParse.groups.rx", "Receiver", "Receiver") },
      { key: "vtx", label: tv("dumpParse.groups.vtx", "VTX", "VTX") },
      { key: "osd", label: tv("dumpParse.groups.osd", "OSD", "OSD") },
      { key: "misc", label: tv("dumpParse.groups.misc", "Otros", "Misc") },
    ],
    [tv]
  );

  const filteredGlobalSettings = useMemo(() => {
    const obj = settings?.global ?? EMPTY_OBJ;
    if (!obj || typeof obj !== "object") return EMPTY_OBJ;

    const q = search.trim().toLowerCase();
    if (!q) return obj;

    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const kk = String(k).toLowerCase();
      const vv = String(v ?? "").toLowerCase();
      if (kk.includes(q) || vv.includes(q)) out[k] = v;
    }
    return out;
  }, [settings, search]);

  const profileGroupSettings = useMemo(() => {
    const prof = settings?.profiles?.[selectedProfile] ?? EMPTY_OBJ;
    const group = prof?.[selectedGroup] ?? EMPTY_OBJ;
    return group && typeof group === "object" ? group : EMPTY_OBJ;
  }, [settings, selectedProfile, selectedGroup]);

  const rateProfileGroupSettings = useMemo(() => {
    const prof = settings?.rateprofiles?.[selectedRateProfile] ?? EMPTY_OBJ;
    const group = prof?.[selectedGroup] ?? EMPTY_OBJ;
    return group && typeof group === "object" ? group : EMPTY_OBJ;
  }, [settings, selectedRateProfile, selectedGroup]);

  const mergedScopedSettings = useMemo(() => {
    const a = profileGroupSettings && typeof profileGroupSettings === "object" ? profileGroupSettings : EMPTY_OBJ;
    const b =
      rateProfileGroupSettings && typeof rateProfileGroupSettings === "object" ? rateProfileGroupSettings : EMPTY_OBJ;
    return { ...a, ...b };
  }, [profileGroupSettings, rateProfileGroupSettings]);

  const globalRows = useMemo(() => {
    return Object.entries(filteredGlobalSettings).map(([k, v]) => ({ key: k, value: String(v) }));
  }, [filteredGlobalSettings]);

  const profileRows = useMemo(() => {
    return Object.entries(profileGroupSettings).map(([k, v]) => ({ key: k, value: String(v) }));
  }, [profileGroupSettings]);

  const rateProfileRows = useMemo(() => {
    return Object.entries(rateProfileGroupSettings).map(([k, v]) => ({ key: k, value: String(v) }));
  }, [rateProfileGroupSettings]);

  // -------- Rates (gráfica + tabla tipo Betaflight, best-effort) --------
  const detectedRates = useMemo(() => {
    const axes = ["roll", "pitch", "yaw"];

    const out = {};
    let any = false;

    for (const ax of axes) {
      const rc = pickNumber(mergedScopedSettings, [
        `${ax}_rc_rate`,
        `rc_rate_${ax}`,
        `${ax}rc_rate`,
        `${ax}_rcRate`,
      ]);

      const sr = pickNumber(mergedScopedSettings, [
        `${ax}_srate`,
        `srate_${ax}`,
        `${ax}_super_rate`,
        `super_rate_${ax}`,
        `${ax}_rate`,
        `rate_${ax}`,
      ]);

      const expo = pickNumber(mergedScopedSettings, [`${ax}_expo`, `expo_${ax}`, `${ax}_rc_expo`, `rc_expo_${ax}`]);

      if (rc != null || sr != null || expo != null) any = true;

      const curve = buildCurve(rc ?? 1, sr ?? 0, expo ?? 0);
      const maxRate = bfSuperRate(1, rc ?? 1, sr ?? 0, expo ?? 0);
      const midRate = bfSuperRate(0.5, rc ?? 1, sr ?? 0, expo ?? 0);

      out[ax] = {
        rc,
        sr,
        expo,
        curve,
        maxRate,
        midRate,
      };
    }

    return { any, axes: out };
  }, [mergedScopedSettings]);

  const ratesTableRows = useMemo(() => {
    if (!detectedRates?.any) return EMPTY_ARR;

    const fmt = (n, digits = 2) => (Number.isFinite(n) ? String(Number(n).toFixed(digits)) : "—");

    return [
      {
        axis: "roll",
        rcRate: detectedRates.axes.roll.rc == null ? "—" : fmt(detectedRates.axes.roll.rc, 3),
        superRate: detectedRates.axes.roll.sr == null ? "—" : fmt(detectedRates.axes.roll.sr, 3),
        expo: detectedRates.axes.roll.expo == null ? "—" : fmt(detectedRates.axes.roll.expo, 3),
        maxDeg: fmt(detectedRates.axes.roll.maxRate, 0),
        centerDeg: fmt(detectedRates.axes.roll.midRate, 0),
      },
      {
        axis: "pitch",
        rcRate: detectedRates.axes.pitch.rc == null ? "—" : fmt(detectedRates.axes.pitch.rc, 3),
        superRate: detectedRates.axes.pitch.sr == null ? "—" : fmt(detectedRates.axes.pitch.sr, 3),
        expo: detectedRates.axes.pitch.expo == null ? "—" : fmt(detectedRates.axes.pitch.expo, 3),
        maxDeg: fmt(detectedRates.axes.pitch.maxRate, 0),
        centerDeg: fmt(detectedRates.axes.pitch.midRate, 0),
      },
      {
        axis: "yaw",
        rcRate: detectedRates.axes.yaw.rc == null ? "—" : fmt(detectedRates.axes.yaw.rc, 3),
        superRate: detectedRates.axes.yaw.sr == null ? "—" : fmt(detectedRates.axes.yaw.sr, 3),
        expo: detectedRates.axes.yaw.expo == null ? "—" : fmt(detectedRates.axes.yaw.expo, 3),
        maxDeg: fmt(detectedRates.axes.yaw.maxRate, 0),
        centerDeg: fmt(detectedRates.axes.yaw.midRate, 0),
      },
    ];
  }, [detectedRates]);

  const headerTitle = tv("dumpParse.title", "Parse del dump #{{id}}", "Dump parse #{{id}}", { id: dumpId });

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-primary/4" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">{headerTitle}</h1>

            <div className="flex flex-wrap items-center gap-2">
              <Chip>{tv("dumpParse.chips.drone", "Dron #{{id}}", "Drone #{{id}}", { id: droneId })}</Chip>
              <Chip>
                {tv(
                  "dumpParse.chips.interpretation",
                  "Interpretación (estilo Betaflight)",
                  "Interpretation (Betaflight-like)"
                )}
              </Chip>
              <Chip>{tv("dumpParse.chips.readonly", "solo lectura", "read-only")}</Chip>
            </div>

            <p className="text-sm text-muted-foreground">
              {tv(
                "dumpParse.subtitle",
                "Esta pantalla carga el dump del backend y muestra secciones con tablas (más parecido a Betaflight).",
                "This screen loads the dump from the backend and shows sections with tables (more Betaflight-like)."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/drones/${droneId}`)}>
              {tv("dumpParse.actions.backDrone", "Volver al dron", "Back to drone")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/manage")}>
              {tv("dumpParse.actions.backManage", "Volver a Gestión", "Back to Manage")}
            </Button>
            <Button variant="outline" onClick={fetchParse} disabled={busy}>
              {busy ? tv("common.loadingBtn", "Cargando...", "Loading...") : tv("common.reload", "Recargar", "Reload")}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex w-fit rounded-2xl bg-white/45 p-1 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-extrabold transition",
                activeTab === "summary"
                  ? "bg-gradient-to-br from-primary to-sky-400 text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/25",
              ].join(" ")}
            >
              {tv("dumpParse.tabs.summary", "Resumen", "Summary")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-extrabold transition",
                activeTab === "settings"
                  ? "bg-gradient-to-br from-primary to-sky-400 text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/25",
              ].join(" ")}
            >
              {tv("dumpParse.tabs.settings", "Ajustes", "Settings")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-extrabold transition",
                activeTab === "raw"
                  ? "bg-gradient-to-br from-primary to-sky-400 text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/25",
              ].join(" ")}
            >
              {tv("dumpParse.tabs.raw", "JSON", "JSON")}
            </button>
          </div>

          <div className="text-xs text-muted-foreground">
            {busy
              ? tv("dumpParse.state.loading", "Cargando parse…", "Loading parse…")
              : data
              ? tv("dumpParse.state.ok", "Parse cargado.", "Parse loaded.")
              : tv("dumpParse.state.none", "Sin datos.", "No data.")}
          </div>
        </div>
      </div>

      <MessageBanner type={banner.type} text={banner.text} />

      {/* Content */}
      {activeTab === "summary" ? (
        <div className="grid gap-6">
          <Card
            title={tv("dumpParse.cards.status", "Estado", "Status")}
            className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
          >
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label={tv("dumpParse.stats.lines", "Líneas", "Lines")}
                  value={stats?.lines_total ?? "—"}
                  sub={tv("dumpParse.stats.linesHint", "Total de líneas detectadas.", "Total lines detected.")}
                />
                <StatCard
                  label={tv("dumpParse.stats.recognized", "Reconocidas", "Recognized")}
                  value={stats?.recognized ?? "—"}
                  sub={tv(
                    "dumpParse.stats.recognizedHint",
                    "Progreso de reconocimiento aproximado.",
                    "Approximate recognition progress."
                  )}
                  progressValue={recognizedRatio}
                />
                <StatCard
                  label={tv("dumpParse.stats.unknown", "Sin clasificar", "Unclassified")}
                  value={stats?.unknown ?? "—"}
                  sub={tv("dumpParse.stats.unknownHint", "Líneas no interpretadas.", "Uninterpreted lines.")}
                />
              </div>

              {warnings.length ? (
                <div className="rounded-2xl bg-white/45 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <div className="text-sm font-extrabold text-foreground">{tv("dumpParse.warnings", "Avisos", "Warnings")}</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Card>

          <Card
            title={tv("dumpParse.cards.firmware", "FC / Firmware", "FC / Firmware")}
            className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
          >
            <KeyValueList
              data={{
                version: firmware?.version_line ?? "",
                board_name: firmware?.board_name ?? "",
                manufacturer_id: firmware?.manufacturer_id ?? "",
                name: firmware?.fc_name ?? "",
              }}
              emptyLabel={tv("dumpParse.empty.firmware", "No se detectó información de firmware.", "No firmware info detected.")}
              limit={20}
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              title={tv("dumpParse.cards.ports", "Ports / Serial", "Ports / Serial")}
              className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
            >
              <SimpleTable
                columns={[
                  { key: "port", label: "port" },
                  { key: "function", label: "functionMask" },
                  { key: "baud", label: "baudRates" },
                ]}
                rows={serialRows}
                emptyLabel={tv("dumpParse.empty.serial", "No hay líneas 'serial' en el dump.", "No 'serial' lines found in the dump.")}
              />
              <div className="mt-3">
                <LinesBox
                  lines={Array.isArray(ports?.serial) ? ports.serial : EMPTY_ARR}
                  emptyLabel={tv("dumpParse.empty.serialRaw", "Sin líneas para mostrar.", "No lines to show.")}
                  limit={20}
                />
              </div>
            </Card>

            <Card
              title={tv("dumpParse.cards.modes", "Modes / AUX", "Modes / AUX")}
              className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
            >
              <SimpleTable
                columns={[
                  { key: "mode", label: "modeId" },
                  { key: "channel", label: "aux" },
                  { key: "range", label: "range" },
                ]}
                rows={auxRows}
                emptyLabel={tv("dumpParse.empty.aux", "No hay líneas 'aux' en el dump.", "No 'aux' lines found in the dump.")}
              />
              <div className="mt-3">
                <LinesBox
                  lines={Array.isArray(modes?.aux) ? modes.aux : EMPTY_ARR}
                  emptyLabel={tv("dumpParse.empty.auxRaw", "Sin líneas para mostrar.", "No lines to show.")}
                  limit={20}
                />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card
              title={tv("dumpParse.cards.features", "Features", "Features")}
              className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
            >
              <div className="grid gap-3">
                <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <div className="text-xs text-muted-foreground">{tv("dumpParse.features.enabled", "Activadas", "Enabled")}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(features?.enabled || []).length ? (
                      features.enabled.map((x) => <Chip key={x}>{x}</Chip>)
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <div className="text-xs text-muted-foreground">{tv("dumpParse.features.disabled", "Desactivadas", "Disabled")}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(features?.disabled || []).length ? (
                      features.disabled.map((x) => <Chip key={x}>{x}</Chip>)
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title={tv("dumpParse.cards.resources", "Resources", "Resources")}
              className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
            >
              <SimpleTable
                columns={[
                  { key: "type", label: "type" },
                  { key: "index", label: "idx" },
                  { key: "pin", label: "pin" },
                ]}
                rows={resourceRows}
                emptyLabel={tv("dumpParse.empty.resources", "No hay líneas 'resource' en el dump.", "No 'resource' lines found in the dump.")}
              />
              <div className="mt-3">
                <LinesBox
                  lines={Array.isArray(resources) ? resources : EMPTY_ARR}
                  emptyLabel={tv("dumpParse.empty.resourcesRaw", "Sin líneas para mostrar.", "No lines to show.")}
                  limit={15}
                />
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "settings" ? (
        <div className="grid gap-6">
          <Card
            title={tv("dumpParse.cards.settings", "Ajustes (estilo Betaflight)", "Settings (Betaflight-like)")}
            className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
          >
            <div className="grid gap-4">
              <Input
                label={tv("dumpParse.search.label", "Buscar en ajustes globales", "Search global settings")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tv("dumpParse.search.ph", "Ej: gyro, osd, rate, dshot…", "e.g. gyro, osd, rate, dshot…")}
              />

              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <div className="text-sm font-extrabold">{tv("dumpParse.settings.global", "Global", "Global")}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {tv(
                      "dumpParse.settings.globalHint",
                      "Mapa de 'set key = value' (filtrado por el buscador).",
                      "Map of 'set key = value' (filtered by the search)."
                    )}
                  </div>

                  <div className="mt-3">
                    <SimpleTable
                      columns={[
                        { key: "key", label: "key" },
                        { key: "value", label: "value" },
                      ]}
                      rows={globalRows.slice(0, 220)}
                      emptyLabel={tv("dumpParse.empty.settings", "No hay ajustes detectados.", "No settings detected.")}
                    />
                    {globalRows.length > 220 ? (
                      <div className="mt-2 text-xs text-muted-foreground">
                        + {globalRows.length - 220} más (limitado para no romper el layout)
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <div className="text-sm font-extrabold">{tv("dumpParse.settings.scoped", "Por perfiles", "By profiles")}</div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {tv(
                      "dumpParse.settings.scopedHint",
                      "Selecciona profile/rateprofile y categoría para ver tablas.",
                      "Select profile/rateprofile and category to view tables."
                    )}
                  </div>

                  <div className="mt-4 grid gap-3">
                    <label className="grid gap-1">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {tv("dumpParse.settings.group", "Categoría", "Category")}
                      </span>
                      <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        className={[
                          "h-11 w-full appearance-none rounded-xl bg-white/45 backdrop-blur-xl px-3 pr-10 text-sm shadow-sm",
                          "ring-1 ring-black/10",
                          "transition-all",
                          "hover:ring-black/15",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        ].join(" ")}
                      >
                        {groupOptions.map((g) => (
                          <option key={g.key} value={g.key}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1">
                        <span className="text-sm font-semibold text-muted-foreground">profile</span>
                        <select
                          value={selectedProfile}
                          onChange={(e) => setSelectedProfile(e.target.value)}
                          className={[
                            "h-11 w-full appearance-none rounded-xl bg-white/45 backdrop-blur-xl px-3 pr-10 text-sm shadow-sm",
                            "ring-1 ring-black/10",
                            "transition-all",
                            "hover:ring-black/15",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          ].join(" ")}
                        >
                          {profileKeys.length ? (
                            profileKeys.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))
                          ) : (
                            <option value="0">0</option>
                          )}
                        </select>
                      </label>

                      <label className="grid gap-1">
                        <span className="text-sm font-semibold text-muted-foreground">rateprofile</span>
                        <select
                          value={selectedRateProfile}
                          onChange={(e) => setSelectedRateProfile(e.target.value)}
                          className={[
                            "h-11 w-full appearance-none rounded-xl bg-white/45 backdrop-blur-xl px-3 pr-10 text-sm shadow-sm",
                            "ring-1 ring-black/10",
                            "transition-all",
                            "hover:ring-black/15",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          ].join(" ")}
                        >
                          {rateProfileKeys.length ? (
                            rateProfileKeys.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))
                          ) : (
                            <option value="0">0</option>
                          )}
                        </select>
                      </label>
                    </div>

                    {/* Rates: gráfica + tabla (solo si estamos en categoría rates) */}
                    {selectedGroup === "rates" ? (
                      <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                        {detectedRates.any ? (
                          <div className="grid gap-4">
                            <RatesChart
                              axes={detectedRates.axes}
                              title={tv("dumpParse.rates.chartTitle", "Rates (gráfica)", "Rates (chart)")}
                              hint={tv(
                                "dumpParse.rates.hint",
                                "Aproximación visual. Si el backend no indica 'rate_type', no es 1:1 garantizado.",
                                "Visual approximation. If backend doesn't provide 'rate_type', not guaranteed 1:1."
                              )}
                            />

                            <div className="grid gap-2">
                              <div className="text-sm font-extrabold">
                                {tv("dumpParse.rates.tableTitle", "Tabla (tipo Betaflight)", "Table (Betaflight-like)")}
                              </div>

                              <SimpleTable
                                columns={[
                                  { key: "axis", label: "axis" },
                                  { key: "rcRate", label: "rcRate" },
                                  { key: "superRate", label: "superRate" },
                                  { key: "expo", label: "expo" },
                                  { key: "centerDeg", label: isEn ? "center≈ (deg/s)" : "centro≈ (deg/s)" },
                                  { key: "maxDeg", label: isEn ? "max≈ (deg/s)" : "máx≈ (deg/s)" },
                                ]}
                                rows={ratesTableRows}
                                emptyLabel="—"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {tv(
                              "dumpParse.rates.missing",
                              "FALTA: no se detectaron claves típicas de rates (roll_rc_rate/roll_rate/roll_expo/roll_srate, etc.) en este dump.",
                              "MISSING: typical rates keys not detected (roll_rc_rate/roll_rate/roll_expo/roll_srate, etc.) in this dump."
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="grid gap-3">
                      <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                        <div className="text-xs text-muted-foreground">
                          {tv("dumpParse.settings.profileView", "profile (PID y varios)", "profile (PID and others)")}
                        </div>
                        <div className="mt-2">
                          <SimpleTable
                            columns={[
                              { key: "key", label: "key" },
                              { key: "value", label: "value" },
                            ]}
                            rows={profileRows.slice(0, 180)}
                            emptyLabel={tv(
                              "dumpParse.empty.profileGroup",
                              "No hay valores en este profile/grupo.",
                              "No values for this profile/group."
                            )}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                        <div className="text-xs text-muted-foreground">
                          {tv("dumpParse.settings.rateProfileView", "rateprofile (rates y varios)", "rateprofile (rates and others)")}
                        </div>
                        <div className="mt-2">
                          <SimpleTable
                            columns={[
                              { key: "key", label: "key" },
                              { key: "value", label: "value" },
                            ]}
                            rows={rateProfileRows.slice(0, 180)}
                            emptyLabel={tv(
                              "dumpParse.empty.rateProfileGroup",
                              "No hay valores en este rateprofile/grupo.",
                              "No values for this rateprofile/group."
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {otherCommands.length ? (
                      <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                        <div className="text-sm font-extrabold">{tv("dumpParse.other.title", "Otros comandos", "Other commands")}</div>
                        <div className="mt-2">
                          <LinesBox lines={otherCommands} emptyLabel="—" limit={80} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "raw" ? (
        <Card title={tv("dumpParse.cards.raw", "Respuesta JSON (debug)", "JSON response (debug)")} className="bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <div className="grid gap-3">
            <div className="text-sm text-muted-foreground">
              {tv(
                "dumpParse.raw.hint",
                "Esto es para comprobar el endpoint. La UI final puede seguir evolucionando hacia Betaflight 1:1.",
                "This is for verifying the endpoint. UI can keep evolving toward a 1:1 Betaflight look."
              )}
            </div>
            <div className="rounded-2xl bg-white/45 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
