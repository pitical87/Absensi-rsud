import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { rekapAbsensi } from "../utils/api/Attendence";

type RekapResponse = {
  sukses: boolean;
  pesan?: string;
  periode: {
    bulan: number;
    tahun: number;
    label: string;
    hari_dalam_bulan: number;
    hari_berjalan: number;
    hari_efektif: number;
  };
  ringkasan: {
    hadir: number;
    tepat_masuk: number;
    terlambat: number;
    total_menit_telat: number;
    tepat_pulang: number;
    pulang_awal: number;
    total_menit_pulang_awal: number;
    izin: number;
    sakit: number;
    cuti: number;
    dinas_luar: number;
    libur: number;
    alpa: number;
    anomali: number;
    persen_kehadiran: number;
    total_jam_kerja: number;
    bintang_bulanan: number | null;
  };
  detail: {
    tanggal: string;
    hari: string;
    status: string;
    keterangan: string | null;
    jam_masuk: string | null;
    jam_pulang: string | null;
    menit_telat: number;
    menit_pulang_awal: number;
    total_jam_kerja: number | null;
    bintang_masuk: number | null;
    bintang_pulang: number | null;
    bintang_harian: number | null;
  }[];
};

const STATUS_BADGE: Record<string, { cls: string; lbl: string }> = {
  "Tepat Waktu": { cls: "bg-green-50 text-green-700", lbl: "Tepat" },
  Terlambat: { cls: "bg-amber-50 text-amber-700", lbl: "Terlambat" },
  "Belum Pulang": { cls: "bg-slate-100 text-slate-600", lbl: "Belum Pulang" },
  Hadir: { cls: "bg-green-50 text-green-700", lbl: "Hadir" },
  Izin: { cls: "bg-blue-50 text-blue-700", lbl: "Izin" },
  Sakit: { cls: "bg-purple-50 text-purple-700", lbl: "Sakit" },
  Cuti: { cls: "bg-teal-50 text-teal-700", lbl: "Cuti" },
  "Dinas Luar": { cls: "bg-cyan-50 text-cyan-700", lbl: "Dinas Luar" },
  Libur: { cls: "bg-slate-100 text-slate-500", lbl: "Libur" },
  Alpa: { cls: "bg-red-50 text-red-700", lbl: "Alpa" },
};

const BULAN_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const fmtTanggal = (t: string) => {
  const d = new Date(t + "T00:00:00");
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Rekap() {
  const [params] = useSearchParams();
  const { user } = useAuth();

  const bulan = Number(params.get("bulan")) || new Date().getMonth() + 1;
  const tahun = Number(params.get("tahun")) || new Date().getFullYear();

  const [data, setData] = useState<RekapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printed = useRef(false);

  useEffect(() => {
    rekapAbsensi(bulan, tahun)
      .then((res) => {
        if (res.sukses) setData(res);
        else setError(res.pesan || "Gagal mengambil data rekap.");
      })
      .catch(() => setError("Terjadi kesalahan saat mengambil data."))
      .finally(() => setLoading(false));
  }, [bulan, tahun]);

  useEffect(() => {
    if (!loading && data && !printed.current) {
      printed.current = true;
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [loading, data]);

  return (
    <div>
      {loading && (
        <div className="p-8 text-center text-sm text-gray-500">
          Memuat data rekap...
        </div>
      )}

      {error && (
        <div className="p-8 text-center text-sm text-red-600">{error}</div>
      )}

      {data && (
        <div className="p-4 print:p-0">
          <div className="print-break-avoid text-center border-b-2 border-gray-800 pb-3 mb-4">
            <h1 className="text-lg font-bold">
              PEMERINTAH DAERAH KABUPATEN MERAUKE
            </h1>
            <h2 className="text-xl font-bold">RSUD MERAUKE</h2>
            <p className="text-xs text-gray-600">
              {user?.unit_kerja?.nama} • {user?.jabatan?.nama ?? user?.posisi}
            </p>
          </div>

          <div className="print-break-avoid mb-4">
            <p className="font-semibold text-sm">{user?.nama_lengkap}</p>
            <p className="text-sm">
              Rekap Kehadiran <strong>{data.periode.label}</strong>
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4 print:grid-cols-8">
            {[
              { val: data.ringkasan.hadir, lbl: "Hadir" },
              { val: data.ringkasan.terlambat, lbl: "Terlambat" },
              { val: data.ringkasan.izin, lbl: "Izin" },
              { val: data.ringkasan.sakit, lbl: "Sakit" },
              { val: data.ringkasan.cuti, lbl: "Cuti" },
              { val: data.ringkasan.dinas_luar, lbl: "Dinas" },
              { val: data.ringkasan.libur, lbl: "Libur" },
              { val: data.ringkasan.alpa, lbl: "Alpa" },
            ].map((s) => (
              <div
                key={s.lbl}
                className="border border-gray-200 rounded-lg px-2 py-2 text-center print-break-avoid">
                <div className="text-lg font-semibold leading-none">
                  {s.val}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">{s.lbl}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mb-4">
            <span>
              Kehadiran: <strong>{data.ringkasan.persen_kehadiran}%</strong>
            </span>
            <span>
              Target: <strong>{data.periode.hari_efektif} hari</strong>
            </span>
            <span>
              Total jam kerja:{" "}
              <strong>{data.ringkasan.total_jam_kerja} jam</strong>
            </span>
            {data.ringkasan.bintang_bulanan !== null && (
              <span>
                Bintang bulanan:{" "}
                <strong>{data.ringkasan.bintang_bulanan}</strong>
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-2 py-1.5 text-left font-medium">
                    Tanggal
                  </th>
                  <th className="border border-gray-200 px-2 py-1.5 text-left font-medium">
                    Hari
                  </th>
                  <th className="border border-gray-200 px-2 py-1.5 text-left font-medium">
                    Masuk
                  </th>
                  <th className="border border-gray-200 px-2 py-1.5 text-left font-medium">
                    Pulang
                  </th>
                  <th className="border border-gray-200 px-2 py-1.5 text-right font-medium">
                    Telat (mnt)
                  </th>
                  <th className="border border-gray-200 px-2 py-1.5 text-right font-medium">
                    Jam Kerja
                  </th>
                  <th className="border border-gray-200 px-2 py-1.5 text-right font-medium">
                    Bintang
                  </th>
                  <th className="border border-gray-200 px-2 py-1.5 text-center font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.detail.map((r) => {
                  const badge = STATUS_BADGE[r.status] ?? {
                    cls: "bg-gray-100 text-gray-600",
                    lbl: r.status,
                  };
                  return (
                    <tr key={r.tanggal} className="print-break-avoid">
                      <td className="border border-gray-200 px-2 py-1.5">
                        {fmtTanggal(r.tanggal)}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5">
                        {r.hari}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5">
                        {r.jam_masuk ?? "—"}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5">
                        {r.jam_pulang ?? "—"}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right">
                        {r.menit_telat > 0 ? r.menit_telat : "0"}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right">
                        {r.total_jam_kerja ?? "—"}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5 text-right">
                        {r.bintang_harian ?? "—"}
                      </td>
                      <td className="border border-gray-200 px-2 py-1.5 text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${badge.cls}`}>
                          {badge.lbl}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
