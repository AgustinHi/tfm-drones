// frontend/src/pages/CommunityDrones.jsx
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

export default function CommunityDrones() {
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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return feed;

    return feed.filter((it) => {
      const post = it?.post || {};
      const drone = it?.drone || {};
      const owner = it?.owner || {};

      const hay = [
        post?.title,
        post?.public_note,
        drone?.id,
        drone?.name,
        drone?.comment,
        drone?.controller,
        drone?.video,
        drone?.radio,
        drone?.components,
        owner?.handle,
      ]
        .filter((x) => x !== null && x !== undefined)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [feed, q]);

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
              {t("community.drones.title", { defaultValue: L("Drones públicos", "Public drones") })}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {t("community.drones.desc", {
                defaultValue: L(
                  "Listado de drones que sus propietarios han decidido publicar desde su hangar.",
                  "A list of drones their owners decided to publish from their hangar."
                ),
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/">
              <Button variant="outline">{t("common.backHome", { defaultValue: L("Volver", "Back") })}</Button>
            </Link>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? t("common.loadingBtn", { defaultValue: L("Cargando…", "Loading…") }) : t("common.reload", { defaultValue: L("Recargar", "Reload") })}
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
              placeholder={t("community.search", { defaultValue: L("Buscar por título, dron, autor…", "Search by title, drone, author…") })}
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
                : t("community.empty.none", { defaultValue: L("Aún no hay drones publicados.", "No public drones yet.") })}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((it) => {
              const post = it?.post || {};
              const drone = it?.drone || {};
              const owner = it?.owner || {};
              const dumps = Array.isArray(it?.dumps) ? it.dumps : [];

              const title = (post?.title || "").trim() || (drone?.name ? drone.name : `Dron #${drone?.id ?? "—"}`);

              return (
                <div key={post?.id ?? `${owner?.handle}-${drone?.id}`} className="rounded-3xl bg-white/55 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-muted-foreground">
                        {t("community.by", { defaultValue: L("Por", "By") })} {owner?.handle || "pilot"} · #{drone?.id ?? "—"}
                      </div>

                      <div className="mt-1 truncate text-lg font-extrabold">{title}</div>

                      <div className="mt-2 grid gap-1 text-sm text-muted-foreground">
                        {drone?.comment ? <div className="line-clamp-2">{drone.comment}</div> : null}

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {drone?.controller ? <span>• {t("detail.fields.controller", { defaultValue: L("Controladora", "Controller") })}: {drone.controller}</span> : null}
                          {drone?.video ? <span>• {t("detail.fields.video", { defaultValue: L("Vídeo", "Video") })}: {drone.video}</span> : null}
                          {drone?.radio ? <span>• {t("detail.fields.radio", { defaultValue: L("Radio", "Radio") })}: {drone.radio}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 text-xs font-extrabold text-foreground ring-1 ring-black/10">
                        {t("community.badge.public", { defaultValue: L("Público", "Public") })}
                      </span>
                    </div>
                  </div>

                  {post?.public_note ? (
                    <div className="mt-4 rounded-2xl bg-white/45 p-4 text-sm text-foreground shadow-sm ring-1 ring-black/10 whitespace-pre-wrap">
                      {post.public_note}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2">
                    <div className="text-xs font-extrabold tracking-wide text-muted-foreground">
                      {t("community.dumps.kicker", { defaultValue: L("Dumps públicos (del post)", "Public dumps (from this post)") })}
                    </div>

                    {dumps.length === 0 ? (
                      <div className="rounded-2xl bg-white/45 p-3 text-sm text-muted-foreground shadow-sm ring-1 ring-black/10">
                        {t("community.dumps.none", { defaultValue: L("Sin dumps públicos asociados.", "No public dumps associated.") })}
                      </div>
                    ) : (
                      <ul className="grid gap-2">
                        {dumps.slice(0, 3).map((d) => (
                          <li key={d?.id ?? `${drone?.id}-dump`} className="rounded-2xl bg-white/45 px-3 py-2 text-sm shadow-sm ring-1 ring-black/10">
                            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0 truncate font-semibold">{d?.original_name || `Dump #${d?.id ?? "—"}`}</div>
                              <div className="text-xs text-muted-foreground">{formatDate(d?.created_at, locale)}</div>
                            </div>
                          </li>
                        ))}

                        {dumps.length > 3 ? (
                          <li className="text-xs text-muted-foreground">
                            {t("community.dumps.more", { defaultValue: L("…y más dumps en esta publicación.", "…and more dumps in this post.") })}
                          </li>
                        ) : null}
                      </ul>
                    )}
                  </div>

                  <div className="mt-4 text-xs text-muted-foreground">
                    {t("community.updated", { defaultValue: L("Actualizado:", "Updated:") })} {formatDate(post?.updated_at, locale)}
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
