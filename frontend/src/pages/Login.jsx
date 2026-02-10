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
        setAuthSuccess("Usuario creado. Ahora inicia sesión.");
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

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">Acceso</h1>
            <p className="text-sm text-muted-foreground">Login / Register</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/">
              <Button variant="outline">Volver</Button>
            </Link>
          </div>
        </div>
      </div>

      {(authError || authSuccess) ? (
        <div
          className={[
            "rounded-xl border px-4 py-3 text-sm",
            authError
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
          ].join(" ")}
        >
          {authError || authSuccess}
        </div>
      ) : null}

      <Card title="Acceso">
        <div className="grid gap-4">
          {/* Tabs */}
          <div className="inline-flex w-fit rounded-xl border bg-background p-1">
            <button
              type="button"
              onClick={() => {
                resetFeedback();
                setAuthMode("login");
              }}
              className={[
                "rounded-lg px-3 py-2 text-sm font-bold transition",
                authMode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                resetFeedback();
                setAuthMode("register");
              }}
              className={[
                "rounded-lg px-3 py-2 text-sm font-bold transition",
                authMode === "register"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="grid gap-3">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              label="Password (mín. 6)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" disabled={busy} className="mt-1">
              {busy ? "Procesando..." : authMode === "login" ? "Login" : "Register"}
            </Button>

            <p className="text-xs text-muted-foreground">
              {authMode === "login"
                ? "Si no tienes cuenta, pulsa Register."
                : "Tras registrarte, volverás a Login automáticamente."}
            </p>
          </form>
        </div>
      </Card>
    </div>
  );
}
