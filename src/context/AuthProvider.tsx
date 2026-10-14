import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  me as fetchMe,
  logout as apiLogout,
} from "../utils/api/Authentication";
import { useNavigate } from "react-router";
import {
  AuthContext,
  type AuthContextType,
  type Lokasi,
  type Permission,
  type User,
} from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [loading, setLoading] = useState(
    () => window.location.pathname !== "/login",
  );
  const isDokter = user?.profesi?.nama.toLocaleLowerCase() == "dokter";

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      switch (permission) {
        case "approve.izin":
        case "approve.lembur":
        case "approve.jadwal":
        case "jadwal.kelola":
          return user.posisi !== "Staf";
        default:
          return true;
      }
    },
    [user],
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname === "/login") return;

    let aktif = true;
    fetchMe()
      .then((res) => {
        if (!aktif) return;
        if (res.sukses) {
          setUser(res.user);
          setLokasi(res.lokasi);
        }
      })
      .catch(() => {
        if (aktif) setUser(null);
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });

    return () => {
      aktif = false;
    };
  }, []);

  const logout = async () => {
    await apiLogout();
    setUser(null);
    navigate("/login");
  };

  const value: AuthContextType = {
    user,
    lokasi,
    isAuthenticated: !!user,
    isDokter,
    loading,
    setLokasi,
    setUser,
    logout,
    can,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
