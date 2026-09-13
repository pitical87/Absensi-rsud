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

export default function ClientPage() {
  // const [hasMasuk, setHasMasuk] = useState(false);
  // const [hasPulang, setHasPulang] = useState(false);
  const [hasLeave, setHasLeave] = useState(false);
  const [todayLeave, setTodayLeave] = useState(null);
  // const [masuk, setMasuk] = useState<{ waktu: string; status: string } | null>(null);
  // const [pulang, setPulang] = useState<{ waktu: string } | null>(null);
  const { isDokter } = useAuth();

  const todaySession = useTodaySession(isDokter);

  const [hasMasukNonDokter, setHasMasuk] = useState(false);
  const [hasPulangNonDokter, setHasPulang] = useState(false);
  const [masukNonDokter, setMasuk] = useState<{ waktu: string; status: string } | null>(null);
  const [pulangNonDokter, setPulang] = useState<{ waktu: string } | null>(null);

  useEffect(() => {
    getTodayLeave().then((res) => {
      setHasLeave(res.hasLeave);
      setTodayLeave(res.izin);
    });
    if (isDokter) return;
    getStatus()
      .then((res) => {
        if (res.sukses) {
          setHasMasuk(!!res.absen_masuk);
          setHasPulang(!!res.absen_pulang);
          setMasuk(res.absen_masuk);
          setPulang(res.absen_pulang);
        }
      })
      .catch(() => {});
  }, [isDokter]);
  const hasMasuk = isDokter ? todaySession.hasMasuk : hasMasukNonDokter;
  const hasPulang = isDokter ? todaySession.hasPulang : hasPulangNonDokter;

  // Untuk HeroCard: format waktu dari latest session dokter
  const masuk = isDokter ? (todaySession.latest ? { waktu: todaySession.latest.jam_masuk, status: "" } : null) : masukNonDokter;
  const pulang = isDokter ? (todaySession.latest?.jam_pulang ? { waktu: todaySession.latest.jam_pulang } : null) : pulangNonDokter;
  return (
    <div>
      <TopNavbar />
      <PerformaBanner />
      {/* present section */}
      <Absensi hasMasuk={hasMasuk} hasPulang={hasPulang} hasLeave={hasLeave} todayLeave={todayLeave} isDokter={isDokter} />
      {/* second top part */}
      <HeroCard masuk={masuk} pulang={pulang} isDokter={isDokter} sesi={todaySession.sessions.length} />
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
