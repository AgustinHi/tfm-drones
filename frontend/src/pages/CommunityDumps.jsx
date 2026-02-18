// frontend/src/pages/CommunityDumps.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import Button from "../ui/Button";
import Input from "../ui/Input";
import MessageBanner from "../ui/MessageBanner";
import { useTranslation } from "react-i18next";

function formatDate(iso, locale) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "—";
  }
}

function buildErrorMessage(err, fallback) {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;

  if (!err?.response) return fallback.network;
  if (status === 401) return fallback.unauthorized;
  if (typeof detail === "string" && detail.trim()) return `${detail} (HTTP ${status})`;
  return `${fallback.http} ${status ?? "?"}`;
}

export default function CommunityDumps() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");
  const locale = isEn ? "en-GB" : "es-ES";
  const L = (es, en) => (isEn ? en : es);

  const [q, setQ] = useState("");
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const fallbackErrors = {
    network: L("Error de red: no se pudo contactar con el servidor.", "Network error: could not reach the server."),
    unauthorized: L("No autorizado. Vuelve a iniciar sesión.", "Unauthorized. Please sign in again."),
    http: L("Error HTTP", "HTTP error"),
  };

  async function load() {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const res = await api.get("/community/feed");
      setFeed(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setFeed([]);
      setMsg({ type: "error", text: buildErrorMessage(err, fallbackErrors) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dumps = useMemo(() => {
    const out = [];

    for (const it of feed || []) {
      const post = it?.post || {};
      const owner = it?.owner || {};
      const drone = it?.drone || {};
      const arr = Array.isArray(it?.dumps) ? it.dumps : [];

      for (const d of arr) {
        out.push({
          id: d?.id,
          original_name: d?.original_name,
          bytes: d?.bytes,
          created_at: d?.created_at,
          droneId: drone?.id,
          droneName: drone?.name,
          ownerHandle: owner?.handle,
          postTitle: post?.title,
        });
      }
    }

    out.sort((a, b) => {
      const da = a?.created_at ? Date.parse(a.created_at) : 0;
      const db = b?.created_at ? Date.parse(b.created_at) : 0;
      if (db !== da) return db - da;
      return (b?.id ?? 0) - (a?.id ?? 0);
    });

    return out;
  }, [feed]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return dumps;

    return dumps.filter((d) => {
      const hay = [
        d?.id,
        d?.original_name,
        d?.bytes,
        d?.ownerHandle,
        d?.droneId,
        d?.droneName,
        d?.postTitle,
      ]
        .filter((x) => x !== null && x !== undefined)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [dumps, q]);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-primary/4" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-extrabold tracking-wide text-muted-foreground">
              {t("community.kicker", { defaultValue: L("Comunidad", "Community") })}
            </div>

            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
              {t("community.dumps.title", { defaultValue: L("Dumps públicos", "Public dumps") })}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {t("community.dumps.desc", {
                defaultValue: L(
                  "Listado de dumps que los propietarios han decidido marcar como públicos.",
                  "A list of dumps that owners decided to mark as public."
                ),
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/">
              <Button variant="outline">{t("common.backHome", { defaultValue: L("Volver", "Back") })}</Button>
            </Link>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading
                ? t("common.loadingBtn", { defaultValue: L("Cargando…", "Loading…") })
                : t("common.reload", { defaultValue: L("Recargar", "Reload") })}
            </Button>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {msg?.text ? <MessageBanner type={msg.type} text={msg.text} /> : null}

      {/* Buscador */}
      <div className="rounded-3xl bg-white/55 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="w-full">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("community.search", {
                defaultValue: L("Buscar por dump, dron, autor…", "Search by dump, drone, author…"),
              })}
            />
          </div>

          <div className="flex items-center justify-end">
            <span className="rounded-xl bg-white/45 px-3 py-2 text-xs font-extrabold text-muted-foreground shadow-sm ring-1 ring-black/10">
              {t("community.count", { defaultValue: L("Resultados:", "Results:") })} {filtered.length}
            </span>
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
            <div className="text-sm text-muted-foreground">{t("common.loading", { defaultValue: L("Cargando…", "Loading…") })}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
            <div className="text-sm text-muted-foreground">
              {q.trim()
                ? t("community.empty.search", { defaultValue: L("No hay resultados para esa búsqueda.", "No results for that search.") })
                : t("community.dumps.none", { defaultValue: L("Aún no hay dumps públicos.", "No public dumps yet.") })}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((d) => {
              const filename = d?.original_name || `Dump #${d?.id ?? "—"}`;
              const metaLeft = `${L("Por", "By")} ${d?.ownerHandle || "pilot"} · ${L("Dron", "Drone")} #${d?.droneId ?? "—"}`;
              const metaRight = `${formatDate(d?.created_at, locale)} · ${Number.isFinite(d?.bytes) ? `${d.bytes} bytes` : `${d?.bytes ?? 0} bytes`}`;

              return (
                <div
                  key={`${d?.id ?? "x"}-${d?.droneId ?? "y"}`}
                  className="rounded-3xl bg-white/55 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-black/10"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-extrabold">{filename}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{metaLeft}</div>
                      {d?.droneName ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {L("Nombre:", "Name:")} {d.droneName}
                        </div>
                      ) : null}
                      {d?.postTitle ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {L("Publicación:", "Post:")} {d.postTitle}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-xs font-semibold text-muted-foreground">{metaRight}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
