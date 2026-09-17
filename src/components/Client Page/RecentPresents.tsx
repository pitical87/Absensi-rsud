import { useMemo } from "react";
import { useEffect, useState } from "react";
import { CiLogin, CiLogout } from "react-icons/ci";
import { FaStar, FaRegStar } from "react-icons/fa6";
import { getAttRecords } from "../../utils/api/Attendence";
import { MdWorkHistory } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

type RecordItem = {
  key: string;
  hari: string;
  tanggal: string;
  tanggal_label: string;
  jam_masuk: string;
  jam_pulang: string | null;
  status: string;
  status_pulang: string | null;
  menit_terlambat: number;
  menit_awal_pulang: number;
  bintang_masuk: number | null;
  bintang_pulang: number | null;
  bintang_harian: number | null;
};

type RowItem = RecordItem & { sesiLabel?: string };

function BintangMini({ nilai }: { nilai: number | null }) {
  if (nilai === null) return null;
  const bulat = Math.round(nilai);
  return (
    <span className="flex gap-0.5 text-amber-400 text-xs mt-1">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= bulat ? <FaStar key={i} /> : <FaRegStar key={i} />,
      )}
    </span>
  );
}

function getRows(record: RecordItem[], isDokter: boolean): RowItem[] {
  const counts = new Map<string, number>();
  for (const r of record) {
    counts.set(r.tanggal, (counts.get(r.tanggal) ?? 0) + 1);
  }
  const cursor = new Map<string, number>();
  return record.map((r, i) => {
    const n = (cursor.get(r.tanggal) ?? 0) + 1;
    cursor.set(r.tanggal, n);
    const total = counts.get(r.tanggal) ?? 1;
    return {
      ...r,
      key: String(i),
      sesiLabel:
        isDokter && total > 1 ? `Sesi ${n}` : undefined,
    };
  });
}

export default function RecentPresents() {
  const [record, setRecord] = useState<RecordItem[]>([]);
  const { user } = useAuth();
  const isDokter =
    user?.profesi?.nama.toLocaleLowerCase() == "dokter";

  useEffect(() => {
    getAttRecords().then((res) => {
      if (res.sukses) setRecord(res.riwayat);
    });
  }, []);

  const rows = useMemo(() => getRows(record, isDokter), [record, isDokter]);

  return (
    <>
      <section className="px-4 sm:px-6 py-4 w-full">
        <h1 className="text-lg w-full font-bold flex items-center gap-3">
          <MdWorkHistory />
          Riwayat Terakhir
        </h1>
        <div className="mt-4">
          <ul className="flex flex-col bg-white border border-gray-300 rounded-xl max-h-70 overflow-y-auto">
            {rows.length === 0 ? (
              <li className="p-4 text-center text-gray-400 text-sm">
                Belum ada riwayat absensi
              </li>
            ) : (
              rows.map((r) => (
                <li
                  key={r.key}
                  className="p-3 sm:p-4 flex items-center justify-between gap-3 border-b border-gray-300">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-md font-medium ">{r.hari}</span>
                    <span className="text-sm text-gray-500">
                      {r.tanggal_label}
                    </span>
                    {r.sesiLabel && (
                      <span className="text-xs text-blue-500 mt-0.5">
                        {r.sesiLabel}
                      </span>
                    )}
                    <BintangMini nilai={r.bintang_harian} />
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 whitespace-nowrap">
                        <CiLogin />
                        {r.jam_masuk}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 whitespace-nowrap">
                        <CiLogout /> {r.jam_pulang}
                      </span>
                    </div>
                    <span
                      className={`text-xs sm:text-sm ${
                        r.status === "Tepat Waktu" || r.status === "Hadir"
                          ? "text-green-500 bg-green-100"
                          : "text-orange-500 bg-orange-100"
                      } w-fit px-2 py-1 rounded-md mt-1`}>
                      {r.status}
                      {r.status === "Terlambat" && r.menit_terlambat > 0
                        ? ` ${r.menit_terlambat} mnt`
                        : ""}
                    </span>
                    {r.status_pulang === "Lebih Awal" && (
                      <span className="text-xs text-red-500 bg-red-100 w-fit px-2 py-1 rounded-md mt-1">
                        Pulang awal {r.menit_awal_pulang} mnt
                      </span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </>
  );
}
