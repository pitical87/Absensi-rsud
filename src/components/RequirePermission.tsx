import { useEffect } from "react";
import { useAuth, type Permission } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router";
import { PageSkeleton } from "./Skeleton";

export default function RequirePermission({
  permission,
}: {
  permission: Permission;
}) {
  const { can, loading, refreshAuth } = useAuth();

  useEffect(() => {
    void refreshAuth();
  }, [permission, refreshAuth]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (!can(permission)) return <Navigate to="/" replace />;
  return <Outlet />;
}
