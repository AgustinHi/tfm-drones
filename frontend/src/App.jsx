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

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/homelogged"
            element={
              <RequireAuthToLogin>
                <HomeLogged />
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
