import { useAuth, type Permission } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router";

export default function RequirePermission({ permission }: { permission: Permission }) {
  const { can } = useAuth();

  if (!can(permission)) return <Navigate to="/" replace />;
  return <Outlet />;
}
