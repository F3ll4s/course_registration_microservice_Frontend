import { Navigate, Outlet, useLocation } from "react-router";
import { isTokenExpired, useAuthStore } from "@/features/auth/store";

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
