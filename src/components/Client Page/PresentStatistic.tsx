import { useEffect, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa6";
import { getStatistic, getStatus } from "../../utils/api/Attendence";
import { FaStarHalfAlt } from "react-icons/fa";
import { IoIosStats } from "react-icons/io";
import { useAuth } from "../../context/AuthContext";
import Skeleton from "../Skeleton";
import useSharedQuery from "../../hooks/useSharedQuery";

type Statistic = {
  kehadiran: { persen: number; hadir: number; target: number };
  jam_kerja: { total_jam: number; target_jam: number };
  ketepatan: { tepat_masuk: number; tepat_pulang: number };
  bintang_bulanan: number | null;
};

type StatusRes = {
  sukses: boolean;
  absen_pulang: {
    waktu: string;
    status: string;
    menit_awal: number;
    bintang: number | null;
  } | null;
  bintang_harian: number | null;
};

function Bintang({ nilai }: { nilai: number }) {
  return (
    <span className="flex gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => {
        if (i <= Math.floor(nilai)) return <FaStar key={i} />;
        if (i - nilai <= 0.5) return <FaStarHalfAlt key={i} />;

        return <FaRegStar key={i} />;
      })}
    </span>
  );
}

function clampPersen(nilai: number): number {
  if (!Number.isFinite(nilai)) return 0;
  return Math.max(0, Math.min(100, nilai));
}

function GrafikRingkasan({
  stat,
  isDokter,
}: {
  stat: Statistic;
  isDokter: boolean;
}) {
  const kehadiranPersen = clampPersen(stat.kehadiran.persen);
  const jamPersen =
    stat.jam_kerja.target_jam > 0
      ? Math.round(
        (stat.jam_kerja.total_jam / stat.jam_kerja.target_jam) * 1000,
      ) / 10
      : 0;

  const radius = 34;
  const keliling = 2 * Math.PI * radius;
  const offset = keliling - (kehadiranPersen / 100) * keliling;
  const warnaDonut =
    kehadiranPersen >= 80
      ? "#10b981"
      : kehadiranPersen >= 60
        ? "#f59e0b"
        : "#ef4444";

  const bars: {
    label: string;
    nilai: number;
    teks: string;
    warna: string;
  }[] = [
      {
        label: "Kehadiran",
        nilai: kehadiranPersen,
        teks: `${stat.kehadiran.persen}%`,
        warna: "bg-emerald-500",
      },
      ...(!isDokter
        ? [
          {
            label: "Target Jam",
            nilai: clampPersen(jamPersen),
            teks: `${Math.round(jamPersen)}%`,
            warna: "bg-blue-500",
          },
          {
            label: "Tepat Masuk",
            nilai: clampPersen(stat.ketepatan.tepat_masuk),
            teks: `${stat.ketepatan.tepat_masuk}%`,
            warna: "bg-indigo-500",
          },
          {
            label: "Tepat Pulang",
            nilai: clampPersen(stat.ketepatan.tepat_pulang),
            teks: `${stat.ketepatan.tepat_pulang}%`,
            warna: "bg-teal-500",
          },
        ]
        : []),
    ];

  return (
    <div className="mt-3 rounded-xl border border-gray-300 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Grafik Capaian Bulan Ini
        </p>
        <span className="text-[11px] text-gray-400">Skala 0–100%</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Ring / Donut Kehadiran */}
        <div className="flex shrink-0 flex-col items-center">
          <div className="relative h-22 w-22">
            <svg
              viewBox="0 0 84 84"
              className="h-full w-full -rotate-90"
              role="img"
              aria-label={`Grafik kehadiran ${stat.kehadiran.persen}%`}>
              <circle
                cx="42"
                cy="42"
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="42"
                cy="42"
                r={radius}
                fill="none"
                stroke={warnaDonut}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={keliling}
                strokeDashoffset={offset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-gray-800">
                {Math.round(stat.kehadiran.persen)}%
              </span>
              <span className="text-[10px] text-gray-400">Hadir</span>
            </div>
          </div>
          <span className="mt-1 text-[11px] text-gray-500">
            {stat.kehadiran.hadir}/{stat.kehadiran.target} hari
          </span>
        </div>

        {/* Simple Horizontal Bar Chart */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {bars.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">{item.label}</span>
                <span className="font-semibold text-gray-800 tabular-nums">
                  {item.teks}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${item.warna}`}
                  style={{ width: `${item.nilai}%` }}
                />
              </div>
            </div>
          ))}
          <div className="flex justify-between pt-0.5 text-[10px] text-gray-400 tabular-nums">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PresentStatistic({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [stat, setStat] = useState<Statistic | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isDokter = user?.profesi?.nama.toLocaleLowerCase() == "dokter";

  const { data: statusRes } = useSharedQuery<StatusRes>("status", getStatus);
  const bintang = statusRes?.bintang_harian ?? null;
  const hasPulang = statusRes?.absen_pulang != null;

  useEffect(() => {
    getStatistic()
      .then((res) => {
        if (res.sukses) setStat(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className={embedded ? "w-full" : "px-4 sm:px-6 py-2 w-full"}>
        {!embedded && (
          <h1 className="text-lg w-full font-bold flex items-center gap-3">
            <IoIosStats />
            Statistik Bulan Ini
          </h1>
        )}
        {/* <div className="mt-4 flex justify-between items-center gap-3 sm:gap-5">
          <div
            className="flex flex-col items-start bg-white border
                  border-gray-300 rounded-xl p-3 sm:p-4 gap-1 w-full min-w-0"
          >
            <span className="text-sm sm:text-md text-gray-500 flex items-center gap-1 w-full">
              <HiOutlineChartPie /> Kehadiran
            </span>
            {loading ? <Skeleton className="h-7 w-16" /> : <span className="text-xl sm:text-2xl font-bold w-full">{stat ? `${stat.kehadiran.persen}%` : "-"}</span>}
            {loading ? <Skeleton className="h-4 w-24" /> : <span className="text-xs sm:text-md text-gray-500 flex items-center gap-1 w-full">{stat ? `${stat.kehadiran.hadir}/${stat.kehadiran.target} hari kerja` : "Memuat..."}</span>}
          </div>
          <div
            className="flex flex-col items-start bg-white border
                  border-gray-300 rounded-xl p-3 sm:p-4 gap-1 w-full min-w-0"
          >
            <span className="text-sm sm:text-md text-gray-500 flex items-center gap-1 w-full">
              <LuClock3 />
              Jam Kerja
            </span>
            {loading ? <Skeleton className="h-7 w-16" /> : <span className="text-xl sm:text-2xl font-bold w-full">{isDokter ? "-" : stat ? `${stat.jam_kerja.total_jam} jam` : "-"}</span>}
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="text-xs sm:text-md text-gray-500 flex items-center gap-1 w-full">{isDokter ? "Jam kerja fleksibel" : stat ? `target ${stat.jam_kerja.target_jam} jam` : "Memuat..."}</span>
            )}
          </div>
        </div> */}

        {isDokter && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">Dokter memiliki jam kerja fleksibel dan dapat melakukan absensi beberapa kali dalam sehari (multi-sesi). Penilaian ketepatan & bintang tidak berlaku.</p>
          </div>
        )}

        {/* {!isDokter && (
          <>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-300 rounded-xl p-3 sm:p-4">
                <p className="text-sm text-gray-500">Tepat Masuk</p>
                {loading ? <Skeleton className="mt-1 h-7 w-16" /> : <p className="mt-1 text-xl sm:text-2xl font-bold">{stat ? `${stat.ketepatan.tepat_masuk}%` : "-"}</p>}
              </div>
              <div className="bg-white border border-gray-300 rounded-xl p-3 sm:p-4">
                <p className="text-sm text-gray-500">Tepat Pulang</p>
                {loading ? <Skeleton className="mt-1 h-7 w-16" /> : <p className="mt-1 text-xl sm:text-2xl font-bold">{stat ? `${stat.ketepatan.tepat_pulang}%` : "-"}</p>}
              </div>
            </div>
          </>
        )} */}

        {/* Grafik simple capaian bulan ini */}
        {loading ? (
          <div className="mt-3 rounded-xl border border-gray-300 bg-white p-4">
            <Skeleton className="h-3.5 w-40 mb-3" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full shrink-0" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            </div>
          </div>
        ) : (
          stat && <GrafikRingkasan stat={stat} isDokter={isDokter} />
        )}

        {!isDokter && (
          <>
            {/* Bintang ketepatan bulan ini */}
            <div className="mt-3 bg-linear-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 flex items-center gap-1">
                  <FaRegStar /> Bintang Ketepatan <span>{hasPulang ? "Hari ini" : "Masuk"}</span>
                </p>
                <p className="text-xs text-amber-600 mt-1">{bintang === null ? "Belum ada penilaian hari ini" : `Rata-rata ${bintang} dari 5 bintang`}</p>
              </div>
              {bintang !== null && <Bintang nilai={bintang} />}
            </div>
          </>
        )}
      </section>
    </>
  );
}
