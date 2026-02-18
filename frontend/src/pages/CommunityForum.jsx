// frontend/src/pages/CommunityForum.jsx
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import { useTranslation } from "react-i18next";

export default function CommunityForum() {
  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");
  const L = (es, en) => (isEn ? en : es);

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
              {t("community.forum.title", { defaultValue: L("Foro / Comunidad", "Forum / Community") })}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {t("community.forum.desc", {
                defaultValue: L(
                  "Zona de contenido libre: preguntas, consejos, builds, enlaces y debates. (Placeholder: se implementa en la siguiente fase).",
                  "Free-content area: questions, tips, builds, links and discussions. (Placeholder: implemented in the next phase)."
                ),
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/">
              <Button variant="outline">{t("common.backHome", { defaultValue: L("Volver", "Back") })}</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Placeholder */}
      <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <h2 className="text-xl font-extrabold tracking-tight">
          {t("community.forum.coming", { defaultValue: L("Próximamente", "Coming soon") })}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {L(
            "Aquí irán publicaciones tipo foro (título, contenido, etiquetas), comentarios y ordenación por actividad. De momento lo dejamos como página accesible y limpia.",
            "This will host forum posts (title, content, tags), comments and sorting by activity. For now, this is a clean accessible placeholder page."
          )}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{L("Publicaciones", "Posts")}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {L("Crear y listar posts con tags.", "Create and list posts with tags.")}
            </div>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{L("Comentarios", "Comments")}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {L("Respuestas en hilo y votos (opcional).", "Threaded replies and votes (optional).")}
            </div>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{L("Orden / Filtros", "Sort / Filters")}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {L("Más recientes, más activos, por tag.", "Newest, most active, by tag.")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
