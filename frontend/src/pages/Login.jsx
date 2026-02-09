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

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const resetFeedback = () => {
    setAuthError("");
    setAuthSuccess("");
  };

  // ✅ 1) Mensaje persistido por el interceptor (401 -> /login)
  useEffect(() => {
    const msg = localStorage.getItem(SESSION_MSG_KEY);
    if (msg) {
      localStorage.removeItem(SESSION_MSG_KEY);
      setAuthSuccess("");
      setAuthError(msg);
    }
  }, []);

  // ✅ 2) Si venimos expulsados por state (compatibilidad)
  useEffect(() => {
    if (reason === "expired") {
      setAuthSuccess("");
      setAuthError("Sesión caducada. Vuelve a iniciar sesión.");
    }
  }, [reason]);

  // ✅ 3) Backup: evento (si lo usas en algún punto)
  useEffect(() => {
    const onLogout = () => {
      setBusy(false);
      setAuthSuccess("");
      setAuthError("Sesión caducada. Vuelve a iniciar sesión.");
    };

    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Acceso</h1>
            <p className="mt-1 text-sm text-gray-600">Login / register</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to="/">
              <Button variant="outline">Volver</Button>
            </Link>
          </div>
        </div>

        {(authError || authSuccess) && (
          <div className="mt-6 grid gap-2">
            {authError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">{authError}</div>
            ) : null}
            {authSuccess ? (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">{authSuccess}</div>
            ) : null}
          </div>
        )}

        <div className="mt-6">
          <Card title="Acceso">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={authMode === "login" ? "default" : "outline"}
                onClick={() => {
                  resetFeedback();
                  setAuthMode("login");
                }}
              >
                Login
              </Button>
              <Button
                variant={authMode === "register" ? "default" : "outline"}
                onClick={() => {
                  resetFeedback();
                  setAuthMode("register");
                }}
              >
                Register
              </Button>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-4 grid gap-3">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input
                label="Password (mín. 6)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={busy}>
                {busy ? "Procesando..." : authMode === "login" ? "Login" : "Register"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
