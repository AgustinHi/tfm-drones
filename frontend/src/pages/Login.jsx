// frontend/src/pages/Login.jsx
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api, { SESSION_MSG_KEY } from "../api";
import { setToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import { useTranslation } from "react-i18next";

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPassword = (v) => v.trim().length >= 6;

function getSafeRedirectTarget(candidate) {
  // React Router puede pasar string o un location-like object
  const raw = typeof candidate === "string" ? candidate : candidate?.pathname;

  if (typeof raw !== "string") return "/manage";

  // Solo permitimos rutas internas (evita http(s)://, //, javascript:, etc.)
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/")) return "/manage";
  if (trimmed.startsWith("//")) return "/manage";
  if (trimmed.toLowerCase().startsWith("/\\") || trimmed.includes("://")) return "/manage";

  // Whitelist mínima (ajusta si añades más rutas públicas)
  const basePath = trimmed.split("?")[0].split("#")[0];
  const allowed = new Set(["/", "/manage"]);
  if (!allowed.has(basePath)) return "/manage";

  return trimmed;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = getSafeRedirectTarget(location.state?.from);
  const reason = location.state?.reason || null;

  const { t, i18n } = useTranslation();
  const isEn = (i18n.resolvedLanguage || i18n.language || "es").startsWith("en");

  // tv estable (evita warning react-hooks/exhaustive-deps)
  const tv = useCallback(
    (key, es, en, opts = {}) =>
      t(key, {
        defaultValue: isEn ? en : es,
        ...opts,
      }),
    [t, isEn]
  );

  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const resetFeedback = () => {
    setAuthError("");
    setAuthSuccess("");
  };

  useEffect(() => {
    const msg = localStorage.getItem(SESSION_MSG_KEY);
    if (msg) {
      localStorage.removeItem(SESSION_MSG_KEY);
      setAuthSuccess("");
      // Nota: msg puede venir ya “cocinado” desde otros puntos (no lo traducimos aquí).
      setAuthError(msg);
    }
  }, []);

  useEffect(() => {
    if (reason === "expired") {
      setAuthSuccess("");
      setAuthError(
        tv("login.reason.expired", "Sesión caducada. Vuelve a iniciar sesión.", "Session expired. Please sign in again.")
      );
    }
  }, [reason, tv]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();

    const eVal = email.trim();
    const pVal = password.trim();

    if (!isValidEmail(eVal)) {
      return setAuthError(tv("login.validation.email", "Email no válido.", "Invalid email."));
    }
    if (!isValidPassword(pVal)) {
      return setAuthError(
        tv(
          "login.validation.password",
          "La contraseña debe tener al menos 6 caracteres.",
          "Password must be at least 6 characters."
        )
      );
    }

    try {
      setBusy(true);

      if (authMode === "register") {
        const res = await api.post("/auth/register", { email: eVal, password: pVal });
        if (res.data?.error) return setAuthError(res.data.error);

        setAuthSuccess(
          tv("login.register.success", "Cuenta creada. Ahora puedes iniciar sesión.", "Account created. You can now sign in.")
        );
        setAuthMode("login");
        return;
      }

      const res = await api.post("/auth/login", { email: eVal, password: pVal });
      if (res.data?.error) return setAuthError(res.data.error);

      setToken(res.data.access_token);
      setAuthSuccess(tv("login.login.success", "Sesión iniciada.", "Signed in."));
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError(tv("login.error.network", "Error de red o servidor.", "Network or server error."));
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const banner =
    authError || authSuccess ? (
      <div
        className={[
          "rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur",
          "ring-1 ring-black/10",
          authError ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
        ].join(" ")}
      >
        {authError || authSuccess}
      </div>
    ) : null;

  return (
    <div className="grid gap-6">
      <div className="mx-auto w-full max-w-xl">
        {/* Panel grande */}
        <div className="relative overflow-hidden rounded-3xl bg-white/55 shadow-xl backdrop-blur-2xl ring-1 ring-black/10 p-6">
          {/* Radial: centro claro -> bordes más oscuros (VISIBLE) */}
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_60%_at_50%_38%,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.78)_30%,rgba(255,255,255,0.46)_55%,rgba(0,0,0,0.10)_78%,rgba(0,0,0,0.16)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-primary/4" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/18 to-transparent" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-sky-400 text-primary-foreground shadow-sm">
                  <span className="text-xs font-black tracking-[0.18em] pl-[0.18em]">DH</span>
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-extrabold tracking-tight">{t("appName", { defaultValue: "DronHangar" })}</div>
                  <div className="text-xs font-semibold text-muted-foreground">{tv("login.kicker", "Acceso", "Access")}</div>
                </div>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight">
                {tv("login.title", "Inicia sesión para continuar", "Sign in to continue")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {tv(
                  "login.subtitle",
                  "Accede a la zona de gestión para crear, editar y borrar drones.",
                  "Access the Manage area to create, edit, and delete drones."
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/">
                <Button variant="outline">{tv("common.back", "Volver", "Back")}</Button>
              </Link>
            </div>
          </div>

          {/* Banner */}
          {banner ? <div className="relative mt-5">{banner}</div> : null}

          {/* Formulario */}
          <div className="relative mt-6">
            <Card title={tv("login.cardTitle", "Acceso", "Access")}>
              <div className="grid gap-4">
                {/* Tabs (bordes suaves) */}
                <div className="inline-flex w-fit rounded-2xl bg-white/45 p-1 shadow-sm backdrop-blur-xl ring-1 ring-black/10">
                  <button
                    type="button"
                    onClick={() => {
                      resetFeedback();
                      setAuthMode("login");
                    }}
                    className={[
                      "rounded-xl px-4 py-2 text-sm font-extrabold transition",
                      authMode === "login"
                        ? "bg-gradient-to-br from-primary to-sky-400 text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/25",
                    ].join(" ")}
                  >
                    {tv("login.tabs.signIn", "Iniciar sesión", "Sign in")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetFeedback();
                      setAuthMode("register");
                    }}
                    className={[
                      "rounded-xl px-4 py-2 text-sm font-extrabold transition",
                      authMode === "register"
                        ? "bg-gradient-to-br from-primary to-sky-400 text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/25",
                    ].join(" ")}
                  >
                    {tv("login.tabs.createAccount", "Crear cuenta", "Create account")}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {authMode === "login"
                    ? tv(
                        "login.help.login",
                        "Si no tienes cuenta, crea una en “Crear cuenta”.",
                        "If you don’t have an account, create one in “Create account”."
                      )
                    : tv(
                        "login.help.register",
                        "Tras crear la cuenta, volverás a “Iniciar sesión” automáticamente.",
                        "After creating the account, you will return to “Sign in” automatically."
                      )}
                </p>

                <form onSubmit={handleAuthSubmit} className="grid gap-3">
                  <Input
                    label={tv("login.email.label", "Email", "Email")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={tv("login.email.placeholder", "tuemail@ejemplo.com", "you@example.com")}
                  />

                  <Input
                    label={tv("login.password.label", "Contraseña (mín. 6)", "Password (min. 6)")}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••"
                  />

                  <div className="pt-1">
                    <Button type="submit" disabled={busy} className="w-full">
                      {busy
                        ? tv("common.processing", "Procesando...", "Processing...")
                        : authMode === "login"
                        ? tv("login.submit.signIn", "Entrar", "Sign in")
                        : tv("login.submit.create", "Crear cuenta", "Create account")}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
