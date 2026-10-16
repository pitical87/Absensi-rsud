import { IoClose } from "react-icons/io5";
import type { PegawaiJadwal, ShiftOpsi } from "../../types/JadwalType";
import { BiCalendar } from "react-icons/bi";
import { useState } from "react";
import MonthGrid from "./MonthGrid";

type Props = {
  pegawai: PegawaiJadwal[];
  bulan: number;
  tahun: number;
  hariDalamBulan: number;
  shiftList: ShiftOpsi[];
  grid: Record<string, Record<string, string>>;
  onUbahSel: (userId: number, tanggal: string, shiftId: string) => void;
  onIsiSemua: (userId: number, shiftId: string) => void;
  onHapus: (userId: number) => void;
};

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function JadwalGridTable({
  pegawai,
  bulan,
  tahun,
  hariDalamBulan,
  shiftList,
  grid,
  onUbahSel,
  onIsiSemua,
  onHapus,
}: Props) {
  const [buka, setBuka] = useState<number | null>(null);
  const [isiShift, setIsiShift] = useState("");
  const hariKe = (d: number): string =>
    HARI[new Date(tahun, bulan - 1, d).getDay()];

  const minggu = (d: number) => new Date(tahun, bulan - 1, d).getDay() === 0;

  return (
    <div className="space-y-3">
      {pegawai.map((p) => {
        const terbuka = buka === p.id;
        const inisial = p.nama_lengkap
          .split(" ")
          .slice(0, 2)
          .map((k) => k[0])
          .join("")
          .toUpperCase();

        return (
          <div
            key={p.id}
            className={`overflow-hidden rounded-2xl border bg-white transition ${
              terbuka ? "border-blue-300 shadow-sm" : "border-gray-200"
            }`}>
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {inisial}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {p.nama_lengkap}
                </p>
                {(p.unit_nama || p.sub_unit_nama) && (
                  <p className="truncate text-xs text-gray-500">
                    {p.sub_unit_nama
                      ? `${p.unit_nama ?? ""} — ${p.sub_unit_nama}`
                      : p.unit_nama}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setBuka((prev) => (prev === p.id ? null : p.id))}
                title="Lihat atau edit kalender jadwal"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition active:scale-95 ${
                  terbuka
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                }`}>
                <BiCalendar className="text-lg" />
              </button>

              <button
                type="button"
                onClick={() => onHapus(p.id)}
                title="Hapus baris ini"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600 active:scale-95">
                <IoClose className="text-lg" />
              </button>
            </div>

            {terbuka && (
              <div className="space-y-4 border-t border-gray-100 bg-gray-50 p-3">
                <MonthGrid
                  bulan={bulan}
                  tahun={tahun}
                  hariDalamBulan={hariDalamBulan}
                  shiftList={shiftList}
                  nilai={grid[String(p.id)] ?? {}}
                  onChange={(tgl, sid) => onUbahSel(p.id, tgl, sid)}
                />

                <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-gray-600">
                      Isi semua hari dengan shift
                    </label>
                    <select
                      value={isiShift}
                      onChange={(e) => setIsiShift(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500">
                      <option value="">Pilih shift...</option>
                      {shiftList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.kategori} · {s.jam_masuk} - {s.jam_pulang}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={!isiShift}
                    onClick={() => {
                      onIsiSemua(p.id, isiShift);
                      setIsiShift("");
                    }}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">
                    Isi Semua
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {/* </div> */}
      {/* <table className="border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 min-w-[180px] border-b border-gray-200 bg-white px-3 py-2 text-left font-semibold text-gray-700">
              Nama Pegawai
            </th>
          </tr>
        </thead>
        <tbody>
          {pegawai.map((p) => {
            const baris = grid[String(p.id)] ?? {};
            return (
              <tr key={p.id}>
                <td className="sticky left-0 z-10 border-b border-gray-100 bg-white px-1 py-1.5">
                  <div className="flex w-[130px] items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onHapus(p.id)}
                      title="Hapus baris ini"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-100 hover:text-red-600">
                      <IoClose />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        title={p.nama_lengkap}
                        className="truncate text-sm font-medium text-gray-800">
                        {p.nama_lengkap}
                      </p>
                      {(p.unit_nama || p.sub_unit_nama) && (
                        <p className="truncate text-[11px] text-gray-500">
                          {p.sub_unit_nama
                            ? `${p.unit_nama ?? ""} — ${p.sub_unit_nama}`
                            : p.unit_nama}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="border-b border-gray-100 px-1 py-1 text-center">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) onIsiSemua(p.id, e.target.value);
                    }}
                    className="w-[62px] rounded-md border border-gray-300 bg-white px-1 py-0.5 text-[11px] text-gray-600 outline-none focus:border-blue-500">
                    <option value="">Isi…</option>
                    {shiftList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.kategori} {s.jam_masuk}
                      </option>
                    ))}
                  </select>
                </td>
                {Array.from({ length: hariDalamBulan }).map((_, i) => {
                  const d = i + 1;
                  const tgl = `${tahun}-${pad(bulan)}-${pad(d)}`;
                  const val = baris[tgl] ?? "";
                  const s = val
                    ? shiftList.find((x) => x.id === Number(val))
                    : null;
                  return (
                    <td
                      key={tgl}
                      className={`border-b border-gray-100 p-0.5 text-center ${minggu(d) ? "bg-red-50/50" : ""}`}>
                      <select
                        value={val}
                        onChange={(e) => onUbahSel(p.id, tgl, e.target.value)}
                        className={`w-[48px] rounded-md border px-0.5 py-0.5 text-[11px] outline-none transition focus:border-blue-500 ${s ? warnaKategori(s.kategori) : "border-gray-200 bg-white text-gray-500"}`}>
                        <option value="">—</option>
                        {shiftList.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.kategori}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table> */}
    </div>
  );
}
