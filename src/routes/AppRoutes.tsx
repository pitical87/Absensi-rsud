import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";

import GuestRoute from "../components/GuestRoute";
import ProtectedRoutes from "../components/ProtectedRoutes";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ClientPage from "../pages/ClientPage";
import RequirePermission from "../components/RequirePermission";

const PresentPage = lazy(() => import("../pages/PresentPage"));
const IzinPage = lazy(() => import("../pages/IzinPage"));
const PendingLeave = lazy(() => import("../pages/PendingLeave"));
const LogbookPage = lazy(() => import("../pages/LogbookPage"));
const LemburPage = lazy(() => import("../pages/LemburPage"));
const AbsenLemburPage = lazy(() => import("../pages/AbsenLemburPage"));
const PersetujuanLembur = lazy(() => import("../pages/PersetujuanLembur"));
const PerubahanJadwalPage = lazy(() => import("../pages/PerubahanJadwalPage"));
const PersetujuanPerubahanJadwal = lazy(() => import("../pages/PersetujuanPerubahanJadwal"));
const KelolaJadwalPage = lazy(() => import("../pages/KelolaJadwalPage"));
const Rekap = lazy(() => import("../components/Rekap"));
const ProfilPage = lazy(() => import("../pages/ProfilPage"));

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Memuat...</div>}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<ClientPage />} />
          <Route path="/present/:type" element={<PresentPage />} />
          <Route path="/izin/" element={<IzinPage />} />
          <Route element={<RequirePermission permission="approve.izin" />}>
            <Route path="/persetujuan" element={<PendingLeave />} />
          </Route>

          <Route path="/lembur" element={<LemburPage />} />
          <Route path="/absen-lembur/:tipe" element={<AbsenLemburPage />} />
          <Route element={<RequirePermission permission="approve.lembur" />}>
            <Route path="/persetujuan-lembur" element={<PersetujuanLembur />} />
          </Route>
          <Route path="/ubah-jadwal" element={<PerubahanJadwalPage />} />
          <Route element={<RequirePermission permission="approve.jadwal" />}>
            <Route path="/persetujuan-jadwal" element={<PersetujuanPerubahanJadwal />} />
          </Route>
          <Route element={<RequirePermission permission="jadwal.kelola" />}>
            <Route path="/kelola-jadwal" element={<KelolaJadwalPage />} />
          </Route>
          <Route path="/logbook" element={<LogbookPage />} />
          <Route path="/rekap" element={<Rekap />} />
          <Route path="/profile" element={<ProfilPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
