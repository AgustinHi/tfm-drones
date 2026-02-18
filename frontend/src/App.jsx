// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import HomeLogged from "./pages/HomeLogged";
import Manage from "./pages/Manage";
import DroneDetail from "./pages/DroneDetail";
import DumpParse from "./pages/DumpParse";
import Login from "./pages/Login";
import RequireAuthToLogin from "./RequireAuthToLogin";
import AppLayout from "./layouts/AppLayout";
import { isLoggedIn } from "./auth";
import CommunityDrones from "./pages/CommunityDrones";
import CommunityDumps from "./pages/CommunityDumps";
import CommunityForum from "./pages/CommunityForum";

function HomeGate() {
  return isLoggedIn() ? <HomeLogged /> : <Home />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Home: pública o logueada según sesión */}
          <Route path="/" element={<HomeGate />} />

          <Route path="/login" element={<Login />} />

          {/* Comunidad (logueado) */}
          <Route
            path="/community/drones"
            element={
              <RequireAuthToLogin>
                <CommunityDrones />
              </RequireAuthToLogin>
            }
          />
          <Route
            path="/community/dumps"
            element={
              <RequireAuthToLogin>
                <CommunityDumps />
              </RequireAuthToLogin>
            }
          />
          <Route
            path="/community/forum"
            element={
              <RequireAuthToLogin>
                <CommunityForum />
              </RequireAuthToLogin>
            }
          />

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
      </AppLayout>
    </BrowserRouter>
  );
}
