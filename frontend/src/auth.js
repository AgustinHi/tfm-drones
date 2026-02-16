// frontend/src/auth.js
const LS_SESSION = "tfm_session";

export function setToken(token) {
  localStorage.setItem(LS_SESSION, token);
}

export function getToken() {
  return localStorage.getItem(LS_SESSION);
}

export function clearToken() {
  localStorage.removeItem(LS_SESSION);
}

export function isLoggedIn() {
  return !!getToken();
}
