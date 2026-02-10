import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Manage from "./pages/Manage";
import DroneDetail from "./pages/DroneDetail";
import DumpParse from "./pages/DumpParse";
import Login from "./pages/Login";
import RequireAuthToLogin from "./RequireAuthToLogin";
import { isLoggedIn } from "./auth";
import Button from "./ui/Button";

function Topbar() {
  const location = useLocation();
  const logged = isLoggedIn();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-extrabold tracking-tight">
            TFM Drones
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">{location.pathname}</span>
        </div>

        <div className="flex items-center gap-2">
          {logged ? (
            <Link to="/manage" className="hidden sm:block">
              <Button variant="outline">Manage</Button>
            </Link>
          ) : (
            <Link to="/login" className="hidden sm:block">
              <Button variant="outline">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Topbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/manage"
            element={
              <RequireAuthToLogin>
                <Manage />
              </RequireAuthToLogin>
            }
          />

          <Route
            path="/drones/:droneId"
            element={
              <RequireAuthToLogin>
                <DroneDetail />
              </RequireAuthToLogin>
            }
          />

          <Route
            path="/drones/:droneId/dumps/:dumpId/parse"
            element={
              <RequireAuthToLogin>
                <DumpParse />
              </RequireAuthToLogin>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
