import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AppLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("tfm_token");
    localStorage.removeItem("tfm_session_msg");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-extrabold tracking-wide">
            TFM Drones
          </Link>

          <nav className="flex items-center gap-2">
            <TopLink to="/">Home</TopLink>
            <TopLink to="/manage">Manage</TopLink>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-4">
        <div className="mx-auto max-w-6xl px-4 text-xs text-white/70">
          © {new Date().getFullYear()} · TFM Drones
        </div>
      </footer>
    </div>
  );
}

function TopLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-xl px-3 py-2 text-sm font-semibold",
          "border border-white/15",
          isActive ? "bg-white/10" : "bg-white/5 hover:bg-white/10",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}
