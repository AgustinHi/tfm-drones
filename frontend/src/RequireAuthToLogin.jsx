import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "./auth";

export default function RequireAuthToLogin({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
