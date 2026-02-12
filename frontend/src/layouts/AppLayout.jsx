import { Link, useLocation } from "react-router-dom";
import { isLoggedIn } from "../auth";
import Button from "../ui/Button";

const BG_URL = "/bg-hangar.jpeg";

function formatPath(pathname) {
  if (!pathname || pathname === "/") return "Inicio";
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "login") return "Iniciar sesión";
  if (parts[0] === "manage") return "Gestión";
  if (parts[0] === "drones" && parts.length === 2) return `Dron #${parts[1]}`;
  if (parts[0] === "drones" && parts[2] === "dumps" && parts[4] === "parse") {
    return `Dron #${parts[1]} · Dump #${parts[3]} · Parse`;
  }

  return parts.map((s) => (s.length ? s[0].toUpperCase() + s.slice(1) : s)).join(" / ");
}

function NavLink({ to, children }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={[
        "relative rounded-xl px-3 py-2 text-sm font-semibold transition",
        "hover:bg-primary/10 hover:text-foreground",
        active ? "bg-primary/12 text-foreground shadow-sm" : "text-muted-foreground",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function MobileNav() {
  const logged = isLoggedIn();
  return (
    <div className="border-t border-border/40 bg-white/55 backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
        <Link
          to="/"
          className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
        >
          Inicio
        </Link>

        {logged ? (
          <Link
            to="/manage"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
          >
            Gestión
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}

function Topbar() {
  const location = useLocation();
  const logged = isLoggedIn();

  return (
    <header className="sticky top-0 z-40">
      <div className="h-[4px] bg-white/55 backdrop-blur-xl">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/55 to-transparent" />
      </div>

      <div className="relative border-b border-border/40 bg-white/55 shadow-sm backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 to-white/40" />
        <div className="pointer-events-none absolute inset-0 bg-primary/6 mix-blend-soft-light" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-primary/18 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-b from-transparent to-black/28" />

        <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" className="group flex items-center gap-3 font-extrabold tracking-tight">
              <span
                className={[
                  "relative inline-flex h-10 w-10 items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-primary to-sky-400 text-primary-foreground",
                  "shadow-sm",
                ].join(" ")}
              >
                <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl blur-md opacity-45 bg-primary" />
                <span className="text-xs font-black tracking-[0.18em] pl-[0.18em]">DH</span>
              </span>

              <span className="truncate">DronHangar</span>
            </Link>

            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              {formatPath(location.pathname)}
            </span>
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink to="/">Inicio</NavLink>
            {logged ? <NavLink to="/manage">Gestión</NavLink> : <NavLink to="/login">Iniciar sesión</NavLink>}
          </nav>

          <div className="flex items-center gap-2 sm:hidden">
            {logged ? (
              <Link to="/manage">
                <Button variant="outline">Gestión</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="outline">Iniciar sesión</Button>
              </Link>
            )}
          </div>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}

function Footer() {
  const logged = isLoggedIn();
  const secondaryHref = logged ? "/manage" : "/login";
  const secondaryLabel = logged ? "Gestión" : "Iniciar sesión";

  return (
    <footer className="mt-auto">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="relative bg-white/55 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 to-white/40" />
        <div className="pointer-events-none absolute inset-0 bg-primary/6 mix-blend-soft-light" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-primary/18 to-transparent" />

        {/* hairline difuminado arriba (sustituye al border-t) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/18 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/12 to-transparent" />

        {/* fade inferior */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-gradient-to-b from-transparent to-black/28" />

        <div className="relative mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} DronHangar · Gestión y consulta de drones
            </p>

            <div className="flex items-center gap-3 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                Inicio
              </Link>
              <span className="text-muted-foreground/40">·</span>
              <Link to={secondaryHref} className="text-muted-foreground hover:text-foreground">
                {secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function PhotoBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${BG_URL}')` }} />
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PhotoBackground />

      <div className="flex min-h-screen flex-col">
        <Topbar />

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
          <div className="space-y-6">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
