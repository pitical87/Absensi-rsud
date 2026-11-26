import { FaMedal, FaStar, FaTrophy } from "react-icons/fa6";
import {
  getPegawaiTeladan,
  type PegawaiTeladanRes,
} from "../../utils/api/Attendence";
import { useAuth } from "../../context/AuthContext";
import useSharedQuery from "../../hooks/useSharedQuery";
import Skeleton from "../Skeleton";

function PeringkatBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100 text-amber-600 shadow-2xs">
        <FaTrophy className="text-sm" />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-600">
        <FaMedal className="text-sm" />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-300 bg-orange-100 text-orange-600">
        <FaMedal className="text-sm" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 tabular-nums">
      {rank}
    </span>
  );
}

export default function PegawaiTeladan({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { user } = useAuth();
  const { data, loading } = useSharedQuery<PegawaiTeladanRes>(
    "pegawai-teladan",
    () => getPegawaiTeladan(),
  );

  const daftar = data?.daftar ?? [];
  const labelPeriode = data?.periode?.label ?? "Bulan Ini";

  return (
    <section className={embedded ? "w-full" : "px-4 sm:px-6 py-4 w-full"}>
      <div
        className={`${embedded ? "mt-3" : "mt-4"} overflow-hidden rounded-xl border border-gray-300 bg-white`}>
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-linear-to-r from-amber-50/80 to-yellow-50/60 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <FaTrophy className="shrink-0 text-amber-500 text-sm" />
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-900 truncate">
              Top 10 Pegawai Teladan
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
            {labelPeriode}
          </span>
        </div>

        <ul className="flex max-h-80 flex-col overflow-y-auto">
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 border-b border-gray-200 p-3 sm:p-4 last:border-b-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </li>
            ))
          ) : daftar.length === 0 ? (
            <li className="p-6 text-center text-sm text-gray-400">
              Belum ada data pegawai teladan pada {labelPeriode}.
            </li>
          ) : (
            daftar.map((item) => {
              const iniSaya = user?.id === item.pegawai_id;
              return (
                <li
                  key={item.pegawai_id}
                  className={`flex items-center justify-between gap-3 border-b border-gray-200 p-3 sm:p-3.5 last:border-b-0 ${
                    iniSaya ? "bg-blue-50/60" : ""
                  }`}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <PeringkatBadge rank={item.peringkat} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {item.nama}
                        </p>
                        {iniSaya && (
                          <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            Anda
                          </span>
                        )}
                      </div>
                      {item.unit && (
                        <p className="truncate text-xs text-gray-500">
                          {item.unit}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {item.hari_tercatat} hr
                        {" · "}
                        {item.jumlah_telat === 0 ? (
                          <span className="font-medium text-emerald-600">
                            Tanpa telat
                          </span>
                        ) : (
                          <span>{item.jumlah_telat}x telat</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600 tabular-nums">
                      <FaStar className="text-xs text-amber-400" />
                      {item.total_bintang}
                    </span>
                    <span className="text-[11px] text-gray-400 tabular-nums">
                      Rata {item.rata_bintang}/5
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </section>
  );
}
