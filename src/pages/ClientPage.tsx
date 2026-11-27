import HeroCard from "../components/Client Page/HeroCard";
import Absensi from "../components/Client Page/Absensi";
import PresentStatistic, {
  BintangKetepatanCard,
} from "../components/Client Page/PresentStatistic";
import RecentPresents from "../components/Client Page/RecentPresents";
import PegawaiTeladan from "../components/Client Page/PegawaiTeladan";
import TopNavbar from "../components/Client Page/TopNavbar";
import SifSection from "../components/Client Page/SifSection";
import PerformaBanner from "../components/Client Page/PerformaBanner";
import VerifikasiEmailBanner from "../components/Client Page/VerifikasiEmailBanner";
import { useEffect, useState } from "react";
import { FaTrophy } from "react-icons/fa6";
import { IoIosStats } from "react-icons/io";
import { MdWorkHistory } from "react-icons/md";
import { getStatus } from "../utils/api/Attendence";
import { getTodayLeave } from "../utils/api/Leave";
import { cekLupaAbsen } from "../utils/api/LupaAbsen";
import type { CekLupaAbsenResponse } from "../types/LupaAbsenType";
import LogBookSection from "../components/Client Page/LogBookSection";
import { useAuth } from "../context/AuthContext";
import useTodaySession from "../hooks/useTodaySession";
import useOpenSession from "../hooks/useOpenSession";
import useSharedQuery from "../hooks/useSharedQuery";
import useSessionShift from "../hooks/useSessionShift";
import {
  GetTodayKey,
  isSesiTerlupakan,
  isShiftLintasHari,
} from "../utils/DateUtils";
import { prefetchMainMenus } from "../routes/prefetchRoutes";

type StatusRes = {
  sukses: boolean;
  absen_masuk: { waktu: string; status: string } | null;
  absen_pulang: { waktu: string } | null;
};

export default function ClientPage() {
  const [hasLeave, setHasLeave] = useState(false);
  const [todayLeave, setTodayLeave] = useState(null);
  const [lupaAbsenInfo, setLupaAbsenInfo] =
    useState<CekLupaAbsenResponse | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<
    "statistik" | "riwayat" | "teladan"
  >("statistik");
  const { isDokter, can, lemburAktif } = useAuth();

  const canKelolaJadwal = can("jadwal.kelola");
  const canApproveIzin = can("approve.izin");
  const canApproveLembur = can("approve.lembur");
  const canApproveJadwal = can("approve.jadwal");
  const canApproveLupaAbsen = can("approve.lupa_absen");

  // Prefetch chunk halaman menu utama saat idle agar perpindahan menu instan
  useEffect(() => {
    return prefetchMainMenus({
      lemburAktif,
      canKelolaJadwal,
      canApproveIzin,
      canApproveLembur,
      canApproveJadwal,
      canApproveLupaAbsen,
    });
  }, [
    lemburAktif,
    canKelolaJadwal,
    canApproveIzin,
    canApproveLembur,
    canApproveJadwal,
    canApproveLupaAbsen,
  ]);

  const todaySession = useTodaySession(isDokter);
  const { openSession } = useOpenSession();

  // Sesi lintas hari (tanggal sesi < hari ini) -> resolve shift pada tanggal sesi,
  // bukan user.shift (yang mengikuti tanggal hari ini).
  const crossDay = !!openSession && openSession.tanggal < GetTodayKey();
  const { shift: sessionShift, loading: loadingSessionShift } = useSessionShift(
    openSession,
    !isDokter && crossDay,
  );

  const sesiTerlupakan =
    !isDokter &&
    !loadingSessionShift &&
    isSesiTerlupakan(openSession, sessionShift);
  const sesiLintasHari =
    !isDokter &&
    !loadingSessionShift &&
    !sesiTerlupakan &&
    isShiftLintasHari(sessionShift);
  const openSesiBerlaku = openSession && !sesiTerlupakan ? openSession : null;

  useEffect(() => {
    let aktif = true;
    getTodayLeave().then((res) => {
      if (!aktif) return;
      setHasLeave(res.hasLeave);
      setTodayLeave(res.izin);
    });
    cekLupaAbsen()
      .then((res) => {
        if (!aktif) return;
        if (res.sukses) {
          setLupaAbsenInfo(res);
        }
      })
      .catch(() => {});
    return () => {
      aktif = false;
    };
  }, []);

  const { data: statusRes } = useSharedQuery<StatusRes>("status", getStatus, {
    enabled: !isDokter,
  });

  const loadingToday = isDokter ? false : !statusRes?.sukses;
  const hasMasukNonDokter = !!statusRes?.absen_masuk;
  const hasPulangNonDokter = !!statusRes?.absen_pulang;
  const masukNonDokter = statusRes?.absen_masuk ?? null;
  const pulangNonDokter = statusRes?.absen_pulang
    ? { waktu: statusRes.absen_pulang.waktu }
    : null;

  const hasMasuk = openSesiBerlaku
    ? true
    : isDokter
      ? todaySession.hasMasuk
      : hasMasukNonDokter;
  const hasPulang = openSesiBerlaku
    ? false
    : isDokter
      ? todaySession.hasPulang
      : hasPulangNonDokter;

  const masuk = openSesiBerlaku
    ? { waktu: openSesiBerlaku.jam_masuk, status: openSesiBerlaku.status }
    : isDokter
      ? todaySession.latest
        ? { waktu: todaySession.latest.jam_masuk, status: "" }
        : null
      : masukNonDokter;
  const pulang = openSesiBerlaku
    ? null
    : isDokter
      ? todaySession.latest?.jam_pulang
        ? { waktu: todaySession.latest.jam_pulang }
        : null
      : pulangNonDokter;

  return (
    <div>
      <TopNavbar />
      <PerformaBanner />
      <VerifikasiEmailBanner />
      {/* present section */}
      <Absensi
        hasMasuk={hasMasuk}
        hasPulang={hasPulang}
        hasLeave={hasLeave}
        todayLeave={todayLeave}
        isDokter={isDokter}
        openSession={
          openSession
            ? {
                tanggal: openSession.tanggal,
                tanggal_label: openSession.tanggal_label,
              }
            : null
        }
        sesiTerlupakan={sesiTerlupakan}
        lintasHari={sesiLintasHari}
        loading={loadingToday}
        showLupaAbsen={lupaAbsenInfo?.tampil_tombol ?? false}
        jumlahAlpa={lupaAbsenInfo?.total_alpa ?? 0}
      />
      {/* second top part */}
      <HeroCard
        masuk={masuk}
        pulang={pulang}
        isDokter={isDokter}
        sesi={todaySession.sessions.length}
        loading={loadingToday}
      />
      {/* logbook section */}
      <LogBookSection
        hasMasuk={hasMasuk}
        hasPulang={hasPulang}
        hasLeave={hasLeave}
      />
      {/* sif & absensi section */}
      <SifSection />
      {/* Tab Statistik, Riwayat & Pegawai Teladan */}
      <section className="px-4 sm:px-6 pt-2 pb-6 w-full">
        <BintangKetepatanCard className="mb-3" />
        <div
          role="tablist"
          aria-label="Statistik, Riwayat, dan Pegawai Teladan"
          className="grid grid-cols-3 gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === "statistik"}
            onClick={() => setActiveBottomTab("statistik")}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-semibold transition ${
              activeBottomTab === "statistik"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <IoIosStats className="text-sm sm:text-base shrink-0" />
            <span>Statistik</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === "riwayat"}
            onClick={() => setActiveBottomTab("riwayat")}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-semibold transition ${
              activeBottomTab === "riwayat"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <MdWorkHistory className="text-sm sm:text-base shrink-0" />
            <span>Riwayat</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === "teladan"}
            onClick={() => setActiveBottomTab("teladan")}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-semibold transition ${
              activeBottomTab === "teladan"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <FaTrophy className="text-xs sm:text-sm shrink-0" />
            <span>Teladan</span>
          </button>
        </div>

        {activeBottomTab === "statistik" ? (
          <PresentStatistic embedded />
        ) : activeBottomTab === "riwayat" ? (
          <RecentPresents embedded />
        ) : (
          <PegawaiTeladan embedded />
        )}
      </section>
    </div>
  );
}
