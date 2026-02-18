// frontend/src/pages/HomeLogged.jsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearToken, isLoggedIn } from "../auth";
import Button from "../ui/Button";
import { useTranslation } from "react-i18next";

function ExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground/50 hover:text-foreground"
    >
      {children}
    </a>
  );
}

function CommunityAccessCard({ to, title, desc, badge }) {
  return (
    <Link to={to} className="block">
      <div
        className={[
          "text-left rounded-3xl bg-white/45 p-5 shadow-sm backdrop-blur-xl ring-1 ring-black/10 transition",
          "hover:bg-white/55 hover:shadow-md",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-extrabold tracking-tight truncate">{title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            {badge ? (
              <span className="inline-flex items-center rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold text-foreground ring-1 ring-black/10">
                {badge}
              </span>
            ) : null}

            <span className="inline-flex items-center rounded-xl px-3 py-1 text-xs font-extrabold ring-1 ring-black/10 bg-primary/14 text-foreground">
              Abrir
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomeLogged() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");
  const L = (es, en) => (isEn ? en : es);
  const tv = (key, es, en, opts = {}) => t(key, { defaultValue: L(es, en), ...opts });

  useEffect(() => {
    if (!isLoggedIn()) window.location.replace("/");
  }, []);

  const logout = () => {
    clearToken();
    window.location.assign("/");
  };

  return (
    <div className="grid gap-6">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-primary/4" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

        <div className="relative grid gap-4 md:grid-cols-[1.6fr_0.9fr] md:items-start">
          <div className="space-y-3">
            <div className="text-xs font-extrabold tracking-wide text-muted-foreground">
              {tv("homeLogged.kicker", "Zona privada", "Private area")}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight">
              {tv("homeLogged.title", "Inicio · Comunidad y recursos", "Home · Community & resources")}
            </h1>

            <p className="text-sm text-muted-foreground">
              {tv(
                "homeLogged.subtitle",
                "Aquí tienes lo que la Home pública promete: accesos a Comunidad (principal) y Recursos oficiales. La gestión de tus drones está en Gestión.",
                "Here you get what the public Home promises: Community (main) and official Resources. Your drone management is in Manage."
              )}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button onClick={() => navigate("/manage")}>{tv("homeLogged.cta.manage", "Ir a Gestión", "Go to Manage")}</Button>
              <Button variant="outline" onClick={logout}>
                {tv("homeLogged.cta.logout", "Cerrar sesión", "Sign out")}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {tv(
                "homeLogged.publishHint",
                "Para aparecer en Comunidad: entra en un dron y publícalo desde su ficha.",
                "To appear in Community: open a drone and publish it from its detail page."
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-white/45 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="text-xs font-extrabold tracking-wide text-muted-foreground/90">
                {tv("homeLogged.quick.kicker", "Acciones rápidas", "Quick actions")}
              </div>

              <div className="mt-3 grid gap-2">
                <Button onClick={() => navigate("/manage")}>
                  {tv("homeLogged.quick.manage", "Abrir Gestión de drones", "Open drone management")}
                </Button>
                <Button variant="outline" onClick={logout}>
                  {tv("homeLogged.quick.logout", "Cerrar sesión", "Sign out")}
                </Button>
              </div>

              <div className="mt-3 text-xs">
                {tv(
                  "homeLogged.quick.safe",
                  "Las acciones peligrosas (borrado) se quedan en Gestión para evitar clics accidentales.",
                  "Risky actions (delete) stay in Manage to avoid accidental clicks."
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMUNIDAD (ACCESOS) */}
      <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <h2 className="text-2xl font-extrabold tracking-tight">{tv("community.title", "Comunidad", "Community")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {tv(
            "community.descAccess",
            "Elige qué consultar. Aquí no se muestra el contenido directamente para mantener la Home limpia.",
            "Choose what to view. Content is not shown directly here to keep Home clean."
          )}
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <CommunityAccessCard
            to="/community/drones"
            title={tv("community.access.drones", "Drones públicos", "Public drones")}
            desc={tv("community.access.dronesDesc", "Tarjetas de drones publicados por sus propietarios.", "Drone cards published by their owners.")}
            badge={tv("community.badge.ready", "OK", "OK")}
          />

          <CommunityAccessCard
            to="/community/dumps"
            title={tv("community.access.dumps", "Dumps públicos", "Public dumps")}
            desc={tv("community.access.dumpsDesc", "Listado directo de dumps marcados como públicos.", "A direct list of dumps marked as public.")}
            badge={tv("community.badge.ready", "OK", "OK")}
          />

          <CommunityAccessCard
            to="/community/forum"
            title={tv("community.access.forum", "Foro / Comunidad", "Forum / Community")}
            desc={tv("community.access.forumDesc", "Posts, preguntas y contenido libre (fase siguiente).", "Posts, questions and free content (next phase).")}
            badge={tv("community.badge.alpha", "ALFA", "ALPHA")}
          />
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          {tv("community.hint2", "Tip: para publicar/ocultar un dron, entra en su ficha desde Gestión.", "Tip: to publish/hide a drone, open its detail page from Manage.")}
        </div>

        <div className="mt-3">
          <Link to="/manage">
            <Button variant="outline">{tv("community.goManage", "Ir a Gestión", "Go to Manage")}</Button>
          </Link>
        </div>
      </div>

      {/* RECURSOS */}
      <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
        <h2 className="text-2xl font-extrabold tracking-tight">
          {tv("resources.title", "Normativa, zonas y vídeos", "Regulations, zones and videos")}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {tv("resources.desc", "Acceso rápido a fuentes oficiales para planificar vuelos y operar con seguridad.", "Quick access to official sources to plan flights and operate safely.")}
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{tv("resources.regs", "Normativa", "Regulations")}</div>
            <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
              <li>
                • <ExternalLink href="https://www.seguridadaerea.gob.es/es/ambitos/drones/tienes-un-uas-dron">{tv("resources.regs.minReq", "Requisitos mínimos (AESA)", "Minimum requirements (AESA)")}</ExternalLink>
              </li>
              <li>
                • <ExternalLink href="https://www.seguridadaerea.gob.es/es/ambitos/drones/normativa-de-uas-drones">{tv("resources.regs.law", "Normativa UAS/Drones (AESA)", "UAS/Drone regulation (AESA)")}</ExternalLink>
              </li>
              <li>
                • <ExternalLink href="https://www.easa.europa.eu/en/domains/drones-air-mobility/operating-drone/open-category-low-risk-civil-drones">{tv("resources.regs.easaOpen", "Categoría Abierta (EASA)", "Open Category (EASA)")}</ExternalLink>
              </li>
              <li>
                • <ExternalLink href="https://sede.seguridadaerea.gob.es/sede-aesa/catalogo-de-procedimientos/curso-de-formacion-y-examen-de-piloto-distancia-en-categoria-abierta">{tv("resources.regs.training", "Curso/examen A1/A3 (AESA)", "A1/A3 course & exam (AESA)")}</ExternalLink>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{tv("resources.zones", "Zonas", "Zones")}</div>
            <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
              <li>
                • <ExternalLink href="https://drones.enaire.es/">{tv("resources.zones.enaire", "Mapa ENAIRE Drones", "ENAIRE Drones map")}</ExternalLink>
              </li>
              <li>
                • <ExternalLink href="https://aip.enaire.es/AIP/UAS-es.html">{tv("resources.zones.aip", "AIP / Zonas UAS (ENAIRE)", "AIP / UAS zones (ENAIRE)")}</ExternalLink>
              </li>
              <li>
                • <ExternalLink href="https://www.seguridadaerea.gob.es/es/ambitos/drones/zonas-geograficas-de-uas">{tv("resources.zones.aesa", "Zonas geográficas UAS (AESA)", "UAS geographical zones (AESA)")}</ExternalLink>
              </li>
              <li>
                • <ExternalLink href="https://enaire.es/AIS/online_maps">{tv("resources.zones.onlinemaps", "Online maps (ENAIRE)", "Online maps (ENAIRE)")}</ExternalLink>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{tv("resources.video", "Vídeo", "Video")}</div>
            <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
              <li>
                • <ExternalLink href="https://www.youtube.com/results?search_query=AESA+drones">{tv("resources.video.aesaSearch", "AESA (YouTube)", "AESA (YouTube)")}</ExternalLink>
              </li>
              <li>
                • <ExternalLink href="https://www.youtube.com/@EASA/videos">{tv("resources.video.easa", "EASA (YouTube)", "EASA (YouTube)")}</ExternalLink>
              </li>
              <li>
                • <ExternalLink href="https://www.seguridadaerea.gob.es/es/ambitos/drones">{tv("resources.video.guides", "Guías y recursos (AESA)", "Guides and resources (AESA)")}</ExternalLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
