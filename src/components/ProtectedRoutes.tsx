import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { PageSkeleton } from "./Skeleton";

export default function ProtectedRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
