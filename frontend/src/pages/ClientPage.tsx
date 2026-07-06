import HeroCard from "../components/Client Page/HeroCard";
import Absensi from "../components/Client Page/Absensi";
import PresentStatistic from "../components/Client Page/PresentStatistic";
import RecentPresents from "../components/Client Page/RecentPresents";
import { GetCurrentDateString } from "../utils/DateUtils";
import { getAttendance } from "../utils/Storage";

export default function ClientPage() {
  const today = GetCurrentDateString();
  const attendence = getAttendance();
  const todayRecords = attendence.filter((r) => r.date === today);
  const masuk = todayRecords.find((r) => r.type === "masuk");
  const pulang = todayRecords.find((r) => r.type === "pulang");

  const hasMasuk: boolean = masuk !== null;
  const hasPulang: boolean = pulang !== null;
  return (
    <div>
      {/* second top part */}
      <HeroCard masuk={masuk} pulang={pulang} />
      {/* present section */}
      <Absensi hasMasuk={hasMasuk} hasPulang={hasPulang} />
      {/* statistic section */}
      <PresentStatistic />
      {/* history section */}
      <RecentPresents />
    </div>
  );
}
