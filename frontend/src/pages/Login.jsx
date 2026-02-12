import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api, { SESSION_MSG_KEY } from "../api";
import { setToken } from "../auth";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPassword = (v) => v.trim().length >= 6;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/manage";
  const reason = location.state?.reason || null;

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
      setAuthError(msg);
    }
  }, []);

  useEffect(() => {
    if (reason === "expired") {
      setAuthSuccess("");
      setAuthError("Sesión caducada. Vuelve a iniciar sesión.");
    }
  }, [reason]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();

    const eVal = email.trim();
    const pVal = password.trim();

    if (!isValidEmail(eVal)) return setAuthError("Email no válido.");
    if (!isValidPassword(pVal)) return setAuthError("La contraseña debe tener al menos 6 caracteres.");

    try {
      setBusy(true);

      if (authMode === "register") {
        const res = await api.post("/auth/register", { email: eVal, password: pVal });
        if (res.data?.error) return setAuthError(res.data.error);
        setAuthSuccess("Cuenta creada. Ahora puedes iniciar sesión.");
        setAuthMode("login");
        return;
      }

      const res = await api.post("/auth/login", { email: eVal, password: pVal });
      if (res.data?.error) return setAuthError(res.data.error);

      setToken(res.data.access_token);
      setAuthSuccess("Sesión iniciada.");
      navigate(from, { replace: true });
    } catch (err) {
      setAuthError("Error de red o servidor.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const banner = authError || authSuccess ? (
    <div
      className={[
        "rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur",
        "ring-1 ring-black/10",
        authError
          ? "bg-destructive/10 text-destructive"
          : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
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
                  <div className="text-sm font-extrabold tracking-tight">DronHangar</div>
                  <div className="text-xs font-semibold text-muted-foreground">Acceso</div>
                </div>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight">Inicia sesión para continuar</h1>
              <p className="text-sm text-muted-foreground">
                Accede a la zona de gestión para crear, editar y borrar drones.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link to="/">
                <Button variant="outline">Volver</Button>
              </Link>
            </div>
          </div>

          {/* Banner */}
          {banner ? <div className="relative mt-5">{banner}</div> : null}

          {/* Formulario */}
          <div className="relative mt-6">
            <Card title="Acceso">
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
                    Iniciar sesión
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
                    Crear cuenta
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {authMode === "login"
                    ? "Si no tienes cuenta, crea una en “Crear cuenta”."
                    : "Tras crear la cuenta, volverás a “Iniciar sesión” automáticamente."}
                </p>

                <form onSubmit={handleAuthSubmit} className="grid gap-3">
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tuemail@ejemplo.com"
                  />

                  <Input
                    label="Contraseña (mín. 6)"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••"
                  />

                  <div className="pt-1">
                    <Button type="submit" disabled={busy} className="w-full">
                      {busy ? "Procesando..." : authMode === "login" ? "Entrar" : "Crear cuenta"}
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
