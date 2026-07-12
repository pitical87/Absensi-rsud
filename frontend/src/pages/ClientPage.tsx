import HeroCard from "../components/Client Page/HeroCard";
import Absensi from "../components/Client Page/Absensi";
import PresentStatistic from "../components/Client Page/PresentStatistic";
import RecentPresents from "../components/Client Page/RecentPresents";
import TopNavbar from "../components/Client Page/TopNavbar";
import SifSection from "../components/Client Page/SifSection";
import { useEffect, useState } from "react";
import { getStatus } from "../utils/api/Attendence";

export default function ClientPage() {
  const [hasMasuk, setHasMasuk] = useState(false);
  const [hasPulang, setHasPulang] = useState(false);
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
  }, []);
  return (
    <div>
      <TopNavbar />
      {/* second top part */}
      <HeroCard masuk={masuk} pulang={pulang} />
      {/* sif & absensi section */}
      <SifSection />
      {/* present section */}
      <Absensi hasMasuk={hasMasuk} hasPulang={hasPulang} />
      {/* statistic section */}
      <PresentStatistic />
      {/* history section */}
      <RecentPresents />
    </div>
  );
}
