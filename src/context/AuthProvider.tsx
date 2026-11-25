import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  me as fetchMe,
  logout as apiLogout,
} from "../utils/api/Authentication";
import { useNavigate } from "react-router";
import {
  AuthContext,
  type AuthContextType,
  type Bawahan,
  type HakAkses,
  type Lokasi,
  type Permission,
  type User,
} from "./AuthContext";

function resolusiLemburAktif(
  lemburAktifApi: unknown,
  hakAkses?: HakAkses | null,
): boolean {
  if (typeof lemburAktifApi === "boolean") {
    return lemburAktifApi;
  }
  if (hakAkses) {
    const punyaHakAtasanLain =
      hakAkses.verifikasi_logbook ||
      hakAkses.buat_jadwal ||
      hakAkses.verifikasi_ijin ||
      hakAkses.verifikasi_perubahan_jadwal;
    if (punyaHakAtasanLain && hakAkses.verifikasi_lembur === false) {
      return false;
    }
  }
  return true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [loading, setLoading] = useState(
    () => window.location.pathname !== "/login",
  );
  const isDokter = user?.profesi?.nama.toLocaleLowerCase() == "dokter";
  const [bawahan, setBawahan] = useState<Bawahan[] | null>([]);
  const [atasan, setAtasan] = useState<Bawahan[] | null>([]);
  const [hakAkses, setHakAkses] = useState<HakAkses | null>(null);
  const [lemburAktif, setLemburAktif] = useState(true);

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      if (permission === "approve.lembur" && !lemburAktif) {
        return false;
      }
      if (user.role === "admin") return true;
      switch (permission) {
        case "jadwal.kelola":
          return hakAkses?.buat_jadwal ?? false;
        case "approve.izin":
          return hakAkses?.verifikasi_ijin ?? false;
        case "approve.lembur":
          return hakAkses?.verifikasi_lembur ?? false;
        case "approve.jadwal":
          return hakAkses?.verifikasi_perubahan_jadwal ?? false;
        default:
          return true;
      }
    },
    [user, hakAkses, lemburAktif],
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
          setBawahan(res.bawahan ?? []);
          setAtasan(res.atasan_langsung ?? res.atasan ?? []);
          setHakAkses(res.hak_akses ?? null);
          setLemburAktif(resolusiLemburAktif(res.lembur_aktif, res.hak_akses));
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
    bawahan,
    setBawahan,
    atasan,
    setAtasan,
    hakAkses,
    setHakAkses,
    lemburAktif,
    setLemburAktif,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
