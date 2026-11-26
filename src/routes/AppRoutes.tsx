import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";

import GuestRoute from "../components/GuestRoute";
import ProtectedRoutes from "../components/ProtectedRoutes";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ClientPage from "../pages/ClientPage";
import RequirePermission from "../components/RequirePermission";
import { PageSkeleton } from "../components/Skeleton";
import { routeLoaders } from "./prefetchRoutes";

const PresentPage = lazy(routeLoaders.present);
const IzinPage = lazy(routeLoaders.izin);
const PendingLeave = lazy(routeLoaders.persetujuan);
const LogbookPage = lazy(routeLoaders.logbook);
const LemburPage = lazy(routeLoaders.lembur);
const AbsenLemburPage = lazy(routeLoaders.absenLembur);
const PersetujuanLembur = lazy(routeLoaders.persetujuanLembur);
const PerubahanJadwalPage = lazy(routeLoaders.ubahJadwal);
const PersetujuanPerubahanJadwal = lazy(routeLoaders.persetujuanJadwal);
const KelolaJadwalPage = lazy(routeLoaders.kelolaJadwal);
const VerifikasiEmailPage = lazy(routeLoaders.verifikasiEmail);
const Rekap = lazy(routeLoaders.rekap);
const ProfilPage = lazy(routeLoaders.profile);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
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
            <Route
              path="/persetujuan-jadwal"
              element={<PersetujuanPerubahanJadwal />}
            />
          </Route>
          <Route element={<RequirePermission permission="jadwal.kelola" />}>
            <Route path="/kelola-jadwal" element={<KelolaJadwalPage />} />
          </Route>
          <Route path="/logbook" element={<LogbookPage />} />
          <Route
            path="/verifikasi-email"
            element={<VerifikasiEmailPage />}
          />
          <Route path="/rekap" element={<Rekap />} />
          <Route path="/profile" element={<ProfilPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
