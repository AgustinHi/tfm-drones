// frontend/src/api.js
import axios from "axios";

// Usamos proxy de Vite (/api) para evitar CORS + preflight
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "tfm_token";
const SESSION_MSG_KEY = "tfm_session_msg";
const IS_DEV = Boolean(import.meta.env.DEV);

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setSessionMessage(text) {
  if (text) localStorage.setItem(SESSION_MSG_KEY, text);
}

function logoutAndRedirectToLogin(message = "Sesión caducada. Inicia sesión de nuevo.") {
  localStorage.removeItem(TOKEN_KEY);
  setSessionMessage(message);

  // Evita bucles si ya estás en /login
  if (window.location.pathname === "/login") return;

  // Redirección “dura” y sin historial (evita volver atrás a /manage con sesión inválida)
  window.location.replace("/login");
}

/**
 * En DEV, si el backend cae, el proxy de Vite suele devolver 500/502/503/504.
 * Lo tratamos como "error de red" (sin response) para que la UI no lo pinte como HTTP 500 real.
 */
function isDevProxyBackendDown(error) {
  if (!IS_DEV) return false;

  const baseURL = error?.config?.baseURL;
  // Solo cuando usamos el proxy "/api"
  if (!(baseURL === "/api" || API_BASE === "/api")) return false;

  const status = error?.response?.status;
  if (![500, 502, 503, 504].includes(status)) return false;

  const headers = error?.response?.headers || {};
  const ctRaw = headers["content-type"] || headers["Content-Type"] || "";
  const ct = String(ctRaw).toLowerCase();

  const data = error?.response?.data;
  const body = typeof data === "string" ? data.toLowerCase() : "";

  // El backend FastAPI suele devolver JSON; el proxy de Vite suele devolver HTML o texto plano.
  const looksHtml = ct.includes("text/html") || body.includes("<!doctype html") || body.includes("<html");
  const looksPlain = ct.includes("text/plain");
  const notJson = !ct.includes("application/json");

  // Mensajes típicos del proxy cuando no puede conectar
  const msg = `${body} ${error?.message || ""}`.toLowerCase();
  const hasProxyHints =
    msg.includes("econnrefused") ||
    msg.includes("socket hang up") ||
    msg.includes("proxy error") ||
    msg.includes("could not proxy") ||
    (msg.includes("connect") && msg.includes("refused"));

  return (notJson && (looksHtml || looksPlain)) || hasProxyHints;
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Request: añade Authorization si hay token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: auto-logout en 401 / manejo red
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // 401: token inválido/expirado -> logout + login
    if (status === 401) {
      logoutAndRedirectToLogin();
      return Promise.reject(error);
    }

    // DEV proxy cuando el backend está caído: forzamos "sin response" para que Manage lo trate como red
    if (isDevProxyBackendDown(error)) {
      error.response = undefined;
      return Promise.reject(error);
    }

    // Sin response => red caída, CORS, backend apagado, DNS, etc.
    if (!error?.response) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
export {
  API_BASE,
  TOKEN_KEY,
  SESSION_MSG_KEY,
  getToken,
  setSessionMessage,
  logoutAndRedirectToLogin,
};
