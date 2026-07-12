import { useEffect, useState } from "react";
import { HiOutlineChartPie } from "react-icons/hi";
import { LuClock3 } from "react-icons/lu";
import { getStatistic } from "../../utils/api/Attendence";

type Statistic = {
  kehadiran: { persen: number; hadir: number; target: number };
  jam_kerja: { total_jam: number; target_jam: number };
};

export default function PresentStatistic() {
  const [stat, setStat] = useState<Statistic | null>(null);
  useEffect(() => {
    getStatistic()
      .then((res) => {
        if (res.sukses) {
          setStat(res);
        }
      })
      .catch(() => {});
  }, []);
  return (
    <>
      <section className="px-6 py-2 w-full">
        <h1 className="text-lg w-full font-bold">Statistik Bulan Ini</h1>
        <div className="mt-4 flex justify-between items-center gap-5">
          <div
            className="flex flex-col items-center bg-white border 
                  border-gray-300 rounded-xl p-4 gap-1 w-full">
            <span className="text-md text-gray-500 flex items-center gap-1 w-full">
              <HiOutlineChartPie /> Kehadiran
            </span>
            <span className="text-2xl font-bold w-full">
              {stat ? `${stat.kehadiran.persen}%` : "-"}
            </span>
            <span className="text-md text-gray-500 flex items-center gap-1 w-full">
              {stat
                ? `${stat.kehadiran.hadir}/${stat.kehadiran.target} hari kerja`
                : "Memuat..."}
            </span>
          </div>
          <div
            className="flex flex-col items-center bg-white border 
                  border-gray-300 rounded-xl p-4 gap-1 w-full">
            <span className="text-md text-gray-500 flex items-center gap-1 w-full">
              <LuClock3 />
              Jam Kerja
            </span>
            <span className="text-2xl font-bold w-full">
              {stat ? `${stat.jam_kerja.total_jam} jam` : "-"}
            </span>
            <span className="text-md text-gray-500 flex items-center gap-1 w-full">
              {stat ? `target ${stat.jam_kerja.target_jam} jam` : "Memuat..."}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
