import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Manage from "./pages/Manage";
import Login from "./pages/Login";
import RequireAuthToLogin from "./RequireAuthToLogin";

export default function App() {
  return (
    <BrowserRouter>
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
