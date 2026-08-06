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

export default function ClientPage() {
  const [hasMasuk, setHasMasuk] = useState(false);
  const [hasPulang, setHasPulang] = useState(false);
  const [hasLeave, setHasLeave] = useState(false);
  const [todayLeave, setTodayLeave] = useState(null);
  const [masuk, setMasuk] = useState<{ waktu: string; status: string } | null>(
    null,
  );
  const [pulang, setPulang] = useState<{ waktu: string } | null>(null);

  useEffect(() => {
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
    getTodayLeave().then((res) => {
      setHasLeave(res.hasLeave);
      setTodayLeave(res.izin);
    });
  }, []);
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
      />
      {/* second top part */}
      <HeroCard masuk={masuk} pulang={pulang} />
      {/* sif & absensi section */}
      <SifSection />
      {/* statistic section */}
      <PresentStatistic />
      {/* history section */}
      <RecentPresents />
    </div>
  );
}
