import { useEffect, useState } from "react";
import { HiOutlineChartPie } from "react-icons/hi";
import { LuClock3 } from "react-icons/lu";
import { FaRegStar, FaStar } from "react-icons/fa6";
import { getStatistic } from "../../utils/api/Attendence";

type Statistic = {
  kehadiran: { persen: number; hadir: number; target: number };
  jam_kerja: { total_jam: number; target_jam: number };
  ketepatan: { tepat_masuk: number; tepat_pulang: number };
  bintang_bulanan: number | null;
};

function Bintang({ nilai }: { nilai: number }) {
  const bulat = Math.round(nilai);
  return (
    <span className="flex gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= bulat ? <FaStar key={i} /> : <FaRegStar key={i} />,
      )}
    </span>
  );
}

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

  const bintang = stat?.bintang_bulanan ?? null;

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

        {/* Ketepatan waktu masuk & pulang */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-300 rounded-xl p-4">
            <p className="text-sm text-gray-500">Tepat Masuk</p>
            <p className="mt-1 text-2xl font-bold">
              {stat ? `${stat.ketepatan.tepat_masuk}%` : "-"}
            </p>
          </div>
          <div className="bg-white border border-gray-300 rounded-xl p-4">
            <p className="text-sm text-gray-500">Tepat Pulang</p>
            <p className="mt-1 text-2xl font-bold">
              {stat ? `${stat.ketepatan.tepat_pulang}%` : "-"}
            </p>
          </div>
        </div>

        {/* Bintang ketepatan bulan ini */}
        <div className="mt-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800 flex items-center gap-1">
              <FaRegStar /> Bintang Ketepatan
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {bintang === null
                ? "Belum ada penilaian bulan ini"
                : `Rata-rata ${bintang} dari 5 bintang`}
            </p>
          </div>
          {bintang !== null && <Bintang nilai={bintang} />}
        </div>
      </section>
    </>
  );
}
