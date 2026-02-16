// frontend/src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import { isLoggedIn, clearToken } from "../auth";
import Button from "../ui/Button";
import { useTranslation } from "react-i18next";

export default function Home() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");
  const L = (es, en) => (isEn ? en : es);

  const logout = () => {
    clearToken();
    navigate("/");
  };

  const resources = [
    {
      title: L("Normativa y seguridad", "Regulations & safety"),
      items: [
        {
          name: L("AESA — Normativa de UAS/drones", "AESA — UAS/drones regulations"),
          url: "https://www.seguridadaerea.gob.es/es/ambitos/drones/normativa-de-uas-drones",
          desc: L("Recopilación oficial de normativa y FAQs.", "Official regulation collection and FAQs."),
        },
        {
          name: L("AESA — ¿Tienes un UAS/dron?", "AESA — Do you have a UAS/drone?"),
          url: "https://www.seguridadaerea.gob.es/es/ambitos/drones/tienes-un-uas-dron",
          desc: L("Obligaciones mínimas antes de volar.", "Minimum obligations before flying."),
        },
        {
          name: L("EASA — Civil Drones", "EASA — Civil Drones"),
          url: "https://www.easa.europa.eu/en/domains/civil-drones",
          desc: L("Portal europeo de referencia (categorías y guías).", "EU reference hub (categories & guidance)."),
        },
      ],
    },
    {
      title: L("Zonas de vuelo y restricciones", "Airspace & restrictions"),
      items: [
        {
          name: L("ENAIRE Drones — Mapa oficial", "ENAIRE Drones — Official map"),
          url: "https://drones.enaire.es/",
          desc: L("Verifica geo-zonas y avisos antes de volar.", "Check geo-zones and notices before flying."),
        },
        {
          name: L("AIP ENAIRE — Zonas geográficas UAS", "ENAIRE AIP — UAS geographical zones"),
          url: "https://aip.enaire.es/AIP/UAS-es.html",
          desc: L("Información AIP sobre zonas UAS para planificar.", "AIP info on UAS zones for planning."),
        },
        {
          name: L("AESA — Zonas geográficas de UAS", "AESA — UAS geographical zones"),
          url: "https://www.seguridadaerea.gob.es/es/ambitos/drones/zonas-geograficas-de-uas",
          desc: L("Explicación oficial + referencia a ENAIRE Drones.", "Official explanation + ENAIRE Drones reference."),
        },
      ],
    },
    {
      title: L("Guías en vídeo (YouTube)", "Video guides (YouTube)"),
      items: [
        {
          name: L("AESA — Playlist “Drones”", "AESA — “Drones” playlist"),
          url: "https://www.youtube.com/playlist?list=PLSwY4yYrMoappQGJ3tzeFIjVFkXrEa_Gs",
          desc: L("Vídeos oficiales de normativa y requisitos.", "Official videos on rules and requirements."),
        },
        {
          name: L("ENAIRE — Canal oficial", "ENAIRE — Official channel"),
          url: "https://www.youtube.com/ENAIRE",
          desc: L("Contenido oficial (navegación aérea y servicios).", "Official content (air navigation & services)."),
        },
        {
          name: L("EASA — Canal oficial", "EASA — Official channel"),
          url: "https://www.youtube.com/channel/UC71zEXeufZ3nfBhs_QUiFeg",
          desc: L("Seguridad y operaciones UAS en Europa.", "UAS safety and operations in Europe."),
        },
      ],
    },
  ];

  return (
    <div className="relative">
      {/* Fondo “futurista” SOLO en Home */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div
          className={[
            "absolute inset-0",
            loggedIn
              ? "opacity-0"
              : "[background:radial-gradient(80%_60%_at_50%_22%,rgba(56,189,248,0.16)_0%,rgba(59,130,246,0.10)_28%,rgba(15,23,42,0.02)_58%,rgba(15,23,42,0.00)_100%)] opacity-100",
          ].join(" ")}
        />
        <div
          className={[
            "absolute inset-0",
            loggedIn ? "opacity-0" : "bg-gradient-to-b from-slate-950/10 via-transparent to-transparent opacity-100",
          ].join(" ")}
        />
        <div
          className={[
            "absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl",
            loggedIn ? "opacity-0" : "bg-sky-400/10 opacity-100",
          ].join(" ")}
        />
      </div>

      <div className="relative grid gap-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-primary/4" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

          <div className="relative grid gap-5 md:grid-cols-[1.6fr_0.9fr] md:items-start">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight">{t("appName", { defaultValue: "DronHangar" })}</h1>

              <p className="text-sm text-muted-foreground">
                {t("home.hero.desc", {
                  defaultValue: L(
                    "Tu hangar digital para drones: fichas, dumps, recursos oficiales y un espacio público para aprender de la comunidad.",
                    "Your digital drone hangar: profiles, dumps, official resources, and a public space to learn from the community."
                  ),
                })}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {loggedIn ? (
                  <>
                    <Button onClick={() => navigate("/manage")}>{L("Ir a Gestión", "Go to Manage")}</Button>
                    <Button variant="outline" onClick={logout}>
                      {L("Cerrar sesión", "Sign out")}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => navigate("/login")}>{L("Iniciar sesión / Crear cuenta", "Sign in / Create account")}</Button>
                )}
              </div>

              {!loggedIn ? (
                <div className="text-xs text-muted-foreground">
                  {L("Acceso completo disponible tras iniciar sesión.", "Full access is available after signing in.")}
                </div>
              ) : null}
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/45 p-4 text-xs text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                <div className="font-semibold text-foreground">{L("Seguro y privado", "Secure & private")}</div>
                <div className="mt-1">
                  {L(
                    "Tu zona de Gestión está protegida con sesión (JWT).",
                    "Your Manage area is protected with a signed-in session (JWT)."
                  )}
                </div>
                <div className="mt-2">
                  <span className="font-semibold text-foreground">{L("Enfoque:", "Focus:")}</span>{" "}
                  {L("rápido, intuitivo y sin perder configuraciones.", "fast, intuitive, and never lose configurations.")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa SOLO sin login (con imagen mock) */}
        {!loggedIn ? (
          <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
            <div className="text-xs font-semibold text-muted-foreground">
              {L("Vista previa (bloqueado)", "Preview (locked)")}
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
              {L("Fácil. Intuitivo. Seguro.", "Easy. Intuitive. Secure.")}
            </h2>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="grid gap-3">
                <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <div className="text-sm font-extrabold">{L("Gestión de drones", "Drone management")}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {L(
                      "Crea fichas completas (controladora, vídeo, radio, componentes y notas).",
                      "Create complete profiles (flight controller, video, radio, components, and notes)."
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <div className="text-sm font-extrabold">{L("Dumps por dron", "Dumps per drone")}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {L(
                      "Sube y revisa tus dumps para tener tu configuración siempre a mano.",
                      "Upload and review dumps so your configuration is always at hand."
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <div className="text-sm font-extrabold">{L("Comunidad pública", "Public community")}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {L(
                      "Descubre configuraciones y consejos compartidos por otros pilotos.",
                      "Explore configs and tips shared by other pilots."
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {L(
                    "Ejemplo visual a la derecha (vista previa). Inicia sesión para crear/editar/subir.",
                    "Visual example on the right (preview). Sign in to create/edit/upload."
                  )}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-white/45 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                {/* Coloca la imagen generada en: frontend/public/home-preview.png */}
                <img
                  src="/home-preview.png"
                  alt={L(
                    "Vista previa: ficha de dron y gestión de dumps",
                    "Preview: drone profile and dumps management"
                  )}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  draggable="false"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Recursos (visible siempre) */}
        <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <div className="text-xs font-semibold text-muted-foreground">{L("Recursos", "Resources")}</div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
            {L("Normativa, zonas y guías oficiales", "Regulations, zones and official guides")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {L(
              "Enlaces directos para comprobar normativa y restricciones antes de volar.",
              "Direct links to check rules and restrictions before flying."
            )}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {resources.map((group) => (
              <div key={group.title} className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                <div className="text-sm font-extrabold">{group.title}</div>
                <ul className="mt-3 grid gap-3">
                  {group.items.map((it) => (
                    <li key={it.url} className="min-w-0">
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl px-3 py-2 transition hover:bg-white/25"
                      >
                        <div className="text-sm font-semibold text-foreground">{it.name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{it.desc}</div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* “Cómo funciona” (sin CTAs repetidos) */}
        <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <div className="text-xs font-semibold text-muted-foreground">{L("Cómo funciona", "How it works")}</div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{L("En 3 pasos", "In 3 steps")}</h2>

          <ol className="mt-4 grid gap-3">
            <li className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-extrabold text-foreground ring-1 ring-black/10">
                  1
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">{L("Inicia sesión", "Sign in")}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {L("Activa tu zona privada de Gestión.", "Unlock your private Manage area.")}
                  </div>
                </div>
              </div>
            </li>

            <li className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-extrabold text-foreground ring-1 ring-black/10">
                  2
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">{L("Crea tus fichas", "Create your profiles")}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {L("Organiza cada dron con sus componentes y notas.", "Organize each drone with components and notes.")}
                  </div>
                </div>
              </div>
            </li>

            <li className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-sm font-extrabold text-foreground ring-1 ring-black/10">
                  3
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold">{L("Adjunta dumps", "Attach dumps")}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {L("Guarda configuraciones por dron para revisarlas cuando lo necesites.", "Store per-drone configs to review anytime.")}
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>

        {/* Resumen (sin “consulta” pública) */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{L("Gestión", "Manage")}</div>
            <div className="mt-1 text-sm text-muted-foreground">{L("CRUD completo tras iniciar sesión.", "Full CRUD after signing in.")}</div>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">Dumps</div>
            <div className="mt-1 text-sm text-muted-foreground">{L("Subida y revisión por dron.", "Upload and review per drone.")}</div>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{L("Recursos", "Resources")}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {L("Normativa, geo-zonas y guías oficiales.", "Rules, geo-zones and official guides.")}
            </div>
          </div>

          <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
            <div className="text-sm font-extrabold">{L("Comunidad", "Community")}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {L("Aprende de configuraciones y consejos compartidos.", "Learn from shared configs and tips.")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
