import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "tfm_token";
const SESSION_MSG_KEY = "tfm_session_msg";

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
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
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

// Response: auto-logout en 401 -> /login + mensaje
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      logoutAndRedirectToLogin();
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
