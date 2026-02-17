// frontend/src/pages/Home.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useTranslation } from "react-i18next";

export default function Home() {
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");
  const L = (es, en) => (isEn ? en : es);

  // Home sin loguear: anula cualquier fondo global previo (hangar), pero NO pinta azul.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const rootParent = root?.parentElement;

    const targets = [html, body, root, rootParent].filter(Boolean);

    const prev = targets.map((el) => ({
      el,
      background: el.style.background,
      backgroundImage: el.style.backgroundImage,
      backgroundColor: el.style.backgroundColor,
    }));

    targets.forEach((el) => {
      el.style.background = "none";
      el.style.backgroundImage = "none";
      el.style.backgroundColor = "transparent";
    });

    return () => {
      prev.forEach((p) => {
        p.el.style.background = p.background;
        p.el.style.backgroundImage = p.backgroundImage;
        p.el.style.backgroundColor = p.backgroundColor;
      });
    };
  }, []);

  return (
    <div className="relative isolate">
      {/* Fondo único: bg-home.png (SIN z-index negativo) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: "url(/bg-home.png)" }}
      />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-black/20" />

      <div className="relative z-10 grid gap-6">
        {/* Hero / CTA */}
        <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-primary/4" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

          <div className="relative grid gap-5 md:grid-cols-[1.6fr_0.9fr] md:items-start">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight">{t("appName", { defaultValue: "DronHangar" })}</h1>

              <p className="text-sm text-muted-foreground">
                {t("home.public.desc", {
                  defaultValue: L(
                    "Centraliza tus drones y configuraciones: fichas, dumps, recursos oficiales y un espacio público para aprender de la comunidad.",
                    "Centralize your drones and configs: profiles, dumps, official resources, and a public space to learn from the community."
                  ),
                })}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button onClick={() => navigate("/login")}>
                  {t("home.cta.loginOrRegister", {
                    defaultValue: L("Iniciar sesión / Crear cuenta", "Sign in / Create account"),
                  })}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                {t("home.public.unlockHint", {
                  defaultValue: L("Inicia sesión para desbloquear todas las funciones.", "Sign in to unlock all features."),
                })}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/45 p-4 text-xs text-muted-foreground shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                <div className="font-semibold text-foreground">{L("Fácil · Intuitivo · Seguro", "Easy · Intuitive · Secure")}</div>
                <div className="mt-1">
                  {L(
                    "Acceso protegido con sesión (JWT) para tu zona privada.",
                    "Protected access with a signed-in session (JWT) for your private area."
                  )}
                </div>
                <div className="mt-2">
                  <span className="font-semibold text-foreground">{L("En segundos:", "In seconds:")}</span>{" "}
                  {L("crea tu hangar y adjunta dumps por dron.", "build your hangar and attach per-drone dumps.")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección ejemplo */}
        <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <h2 className="text-2xl font-extrabold tracking-tight">{L("Así se siente por dentro", "This is what it feels like inside")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {L(
              "Una interfaz pensada para que encuentres y mantengas tus configuraciones sin fricción.",
              "An interface designed to keep your configurations accessible with zero friction."
            )}
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                <div className="text-sm font-extrabold">{L("Fichas claras", "Clean profiles")}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {L("Componentes, radio, vídeo y notas en un solo sitio.", "Components, radio, video and notes in one place.")}
                </div>
              </div>

              <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                <div className="text-sm font-extrabold">{L("Dumps por dron", "Dumps per drone")}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {L("Sube, revisa y guarda versiones para no perder cambios.", "Upload, review and keep versions so you never lose changes.")}
                </div>
              </div>

              <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                <div className="text-sm font-extrabold">{L("Recursos", "Resources")}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {L("Normativa, zonas y guías (disponible al iniciar sesión).", "Rules, zones and guides (available after sign-in).")}
                </div>
              </div>

              <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                <div className="text-sm font-extrabold">{L("Público / Comunidad", "Public / Community")}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {L("Aprende de configuraciones y consejos compartidos.", "Learn from shared configs and tips.")}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-white/45 shadow-sm backdrop-blur-xl ring-1 ring-black/10 h-[300px] sm:h-[360px] lg:h-[420px] p-4">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              <img
                src="/home-preview.png"
                alt={L("Ejemplo: tarjeta de dron y dumps", "Example: drone card and dumps")}
                className="h-full w-full object-contain"
                loading="lazy"
                draggable="false"
              />
            </div>
          </div>
        </div>

        {/* Recursos */}
        <div className="rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
          <h2 className="text-2xl font-extrabold tracking-tight">{L("Normativa, zonas y vídeos", "Regulations, zones and videos")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {L(
              "Acceso rápido a fuentes oficiales para planificar vuelos y operar con seguridad (disponible al iniciar sesión).",
              "Quick access to official sources to plan flights and operate safely (available after sign-in)."
            )}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="text-sm font-extrabold">{L("Normativa", "Regulations")}</div>
              <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
                <li>• {L("Guías oficiales", "Official guidance")}</li>
                <li>• {L("Buenas prácticas", "Best practices")}</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="text-sm font-extrabold">{L("Zonas", "Zones")}</div>
              <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
                <li>• {L("Geo-zonas y restricciones", "Geo-zones and restrictions")}</li>
                <li>• {L("Planificación previa", "Pre-flight planning")}</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white/45 p-4 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
              <div className="text-sm font-extrabold">{L("Vídeo", "Video")}</div>
              <ul className="mt-2 grid gap-2 text-sm text-muted-foreground">
                <li>• {L("Playlists oficiales", "Official playlists")}</li>
                <li>• {L("Guías rápidas", "Quick guides")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
