import HeroCard from "../components/Client Page/HeroCard";
import Absensi from "../components/Client Page/Absensi";
import PresentStatistic from "../components/Client Page/PresentStatistic";
import RecentPresents from "../components/Client Page/RecentPresents";
import TopNavbar from "../components/Client Page/TopNavbar";
import SifSection from "../components/Client Page/SifSection";
import PerformaBanner from "../components/Client Page/PerformaBanner";
import { useEffect, useState } from "react";
import { getStatus } from "../utils/api/Attendence";
import { getTodayLeave } from "../utils/api/Leave";
import LogBookSection from "../components/Client Page/LogBookSection";
import { useAuth } from "../context/AuthContext";
import useTodaySession from "../hooks/useTodaySession";
import useOpenSession from "../hooks/useOpenSession";

import useSharedQuery from "../hooks/useSharedQuery";

type StatusRes = {
  sukses: boolean;
  absen_masuk: { waktu: string; status: string } | null;
  absen_pulang: { waktu: string } | null;
};

export default function ClientPage() {
  const [hasLeave, setHasLeave] = useState(false);
  const [todayLeave, setTodayLeave] = useState(null);
  const { isDokter } = useAuth();

  const todaySession = useTodaySession(isDokter);
  const { openSession } = useOpenSession();
  useEffect(() => {
    let aktif = true;
    getTodayLeave().then((res) => {
      if (!aktif) return;
      setHasLeave(res.hasLeave);
      setTodayLeave(res.izin);
    });
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
  const pulangNonDokter = statusRes?.absen_pulang ? { waktu: statusRes.absen_pulang.waktu } : null;

  const hasMasuk = openSession ? true : isDokter ? todaySession.hasMasuk : hasMasukNonDokter;
  const hasPulang = openSession ? false : isDokter ? todaySession.hasPulang : hasPulangNonDokter;

  const masuk = openSession ? { waktu: openSession.jam_masuk, status: openSession.status } : isDokter ? (todaySession.latest ? { waktu: todaySession.latest.jam_masuk, status: "" } : null) : masukNonDokter;
  const pulang = openSession ? null : isDokter ? (todaySession.latest?.jam_pulang ? { waktu: todaySession.latest.jam_pulang } : null) : pulangNonDokter;

  return (
    <div>
      <TopNavbar />
      <PerformaBanner />
      {/* present section */}
      <Absensi
        hasMasuk={hasMasuk}
        hasPulang={hasPulang}
        hasLeave={hasLeave}
        todayLeave={todayLeave}
        isDokter={isDokter}
        openSession={openSession ? { tanggal: openSession.tanggal, tanggal_label: openSession.tanggal_label } : null}
        loading={loadingToday}
      />
      {/* second top part */}
      <HeroCard masuk={masuk} pulang={pulang} isDokter={isDokter} sesi={todaySession.sessions.length} loading={loadingToday} />
      {/* logbook section */}
      <LogBookSection hasMasuk={hasMasuk} hasPulang={hasPulang} hasLeave={hasLeave} />
      {/* sif & absensi section */}
      <SifSection />
      {/* statistic section */}
      <PresentStatistic />
      {/* history section */}
      <RecentPresents />
    </div>
  );
}
