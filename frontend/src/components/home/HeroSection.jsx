import Button from "../../ui/Button";
import { useNavigate } from "react-router-dom";
import { CardBox } from "./CardComponents";
import { useTranslationHelper } from "../../hooks/useTranslationHelper";

export function HeroSection() {
  const navigate = useNavigate();
  const { t, tv, isEn } = useTranslationHelper();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/55 p-6 shadow-xl backdrop-blur-2xl ring-1 ring-black/10">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-primary/4" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

      <div className="relative grid gap-5 md:grid-cols-[1.6fr_0.9fr] md:items-start">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight">
            {t("appName", { defaultValue: "DronHangar" })}
          </h1>

          <p className="text-sm text-muted-foreground">
            {tv(
              "home.public.desc",
              "Centraliza tus drones y configuraciones: fichas, dumps, recursos oficiales y un espacio público para aprender de la comunidad.",
              "Centralize your drones and configs: profiles, dumps, official resources, and a public space to learn from the community."
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button onClick={() => navigate("/login")}>
              {tv(
                "home.cta.loginOrRegister",
                "Iniciar sesión / Crear cuenta",
                "Sign in / Create account"
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {tv(
              "home.public.unlockHint",
              "Inicia sesión para desbloquear todas las funciones.",
              "Sign in to unlock all features."
            )}
          </div>
        </div>

        <div className="grid gap-3">
          <CardBox>
            <div className="font-semibold text-foreground">
              {isEn ? "Easy · Intuitive · Secure" : "Fácil · Intuitivo · Seguro"}
            </div>
            <div className="mt-1">
              {isEn
                ? "Protected access with a signed-in session (JWT) for your private area."
                : "Acceso protegido con sesión (JWT) para tu zona privada."}
            </div>
            <div className="mt-2">
              <span className="font-semibold text-foreground">
                {isEn ? "In seconds:" : "En segundos:"}
              </span>{" "}
              {isEn
                ? "build your hangar and attach per-drone dumps."
                : "crea tu hangar y adjunta dumps por dron."}
            </div>
          </CardBox>
        </div>
      </div>
    </div>
  );
}
