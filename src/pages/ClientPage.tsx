import HeroCard from "../components/Client Page/HeroCard";
import Absensi from "../components/Client Page/Absensi";
import PresentStatistic from "../components/Client Page/PresentStatistic";
import RecentPresents from "../components/Client Page/RecentPresents";
import TopNavbar from "../components/Client Page/TopNavbar";
import SifSection from "../components/Client Page/SifSection";
import PerformaBanner from "../components/Client Page/PerformaBanner";
import ShiftWeekSlider, { type WeekSliderItem } from "../components/Client Page/ShiftWeekSlider";
import { useEffect, useState } from "react";
import { getStatus } from "../utils/api/Attendence";
import { getTodayLeave } from "../utils/api/Leave";
import LogBookSection from "../components/Client Page/LogBookSection";
import { useAuth } from "../context/AuthContext";
import useTodaySession from "../hooks/useTodaySession";
import useOpenSession, { type SessionRecord } from "../hooks/useOpenSession";
import { GetTodayKey, GetWeekDays } from "../utils/DateUtils";

export default function ClientPage() {
  const [hasLeave, setHasLeave] = useState(false);
  const [todayLeave, setTodayLeave] = useState(null);
  const { isDokter } = useAuth();

  const todaySession = useTodaySession(isDokter);
  const { records, openSession, loading } = useOpenSession();

  const [hasMasukNonDokter, setHasMasuk] = useState(false);
  const [hasPulangNonDokter, setHasPulang] = useState(false);
  const [masukNonDokter, setMasuk] = useState<{ waktu: string; status: string } | null>(null);
  const [pulangNonDokter, setPulang] = useState<{ waktu: string } | null>(null);

  const [selectedTanggal, setSelectedTanggal] = useState<string | null>(null);
  const activeTanggal = selectedTanggal ?? openSession?.tanggal ?? GetTodayKey();

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

  const week = GetWeekDays();
  const todayKey = GetTodayKey();
  const byTanggal = new Map<string, SessionRecord>();
  for (const r of records) {
    if (!byTanggal.has(r.tanggal)) byTanggal.set(r.tanggal, r);
  }
  const days: WeekSliderItem[] = week.map((d) => {
    const r = byTanggal.get(d.tanggal);
    return {
      ...d,
      jamMasuk: r?.jam_masuk ?? null,
      jamPulang: r?.jam_pulang ?? null,
      isOpen: openSession?.tanggal === d.tanggal,
      isToday: d.tanggal === todayKey,
    };
  });
  if (openSession && !week.some((d) => d.tanggal === openSession.tanggal)) {
    days.push({
      tanggal: openSession.tanggal,
      hari: openSession.hari,
      label: openSession.tanggal_label,
      jamMasuk: openSession.jam_masuk,
      jamPulang: openSession.jam_pulang,
      isOpen: true,
      isToday: false,
    });
  }

  const hasMasuk = openSession
    ? true
    : isDokter
      ? todaySession.hasMasuk
      : hasMasukNonDokter;
  const hasPulang = openSession
    ? false
    : isDokter
      ? todaySession.hasPulang
      : hasPulangNonDokter;

  const masuk = openSession
    ? { waktu: openSession.jam_masuk, status: openSession.status }
    : isDokter
      ? todaySession.latest
        ? { waktu: todaySession.latest.jam_masuk, status: "" }
        : null
      : masukNonDokter;
  const pulang = openSession
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
      {/* present section */}
      <Absensi
        hasMasuk={hasMasuk}
        hasPulang={hasPulang}
        hasLeave={hasLeave}
        todayLeave={todayLeave}
        isDokter={isDokter}
        openSession={openSession ? { tanggal: openSession.tanggal, tanggal_label: openSession.tanggal_label } : null}
        selectedTanggal={activeTanggal}
      />
      {/* second top part */}
      <HeroCard masuk={masuk} pulang={pulang} isDokter={isDokter} sesi={todaySession.sessions.length} />
      {/* week shift slider */}
      <ShiftWeekSlider
        days={days}
        selected={activeTanggal}
        onSelect={setSelectedTanggal}
        openSession={openSession ? { tanggal: openSession.tanggal, label: openSession.tanggal_label } : null}
        loading={loading}
      />
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