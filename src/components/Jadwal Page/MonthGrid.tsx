import { useState } from "react";
import { FaRegCalendarTimes } from "react-icons/fa";
import type { ShiftOpsi } from "../../types/JadwalType";

type Props = {
  bulan: number;
  tahun: number;
  hariDalamBulan: number;
  shiftList: ShiftOpsi[];
  nilai: Record<string, string>;
  onChange: (tanggal: string, shiftId: string) => void;
};

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const pad = (n: number) => String(n).padStart(2, "0");

function warnaKategori(k: string): string {
  return k === "Pagi"
    ? "bg-green-100 text-green-700"
    : k === "Siang"
      ? "bg-sky-100 text-sky-700"
      : k === "Sore"
        ? "bg-orange-100 text-orange-700"
        : k === "Malam"
          ? "bg-blue-100 text-blue-700"
          : "bg-gray-100 text-gray-700";
}

export default function MonthGrid({
  bulan,
  tahun,
  hariDalamBulan,
  shiftList,
  nilai,
  onChange,
}: Props) {
  const [buka, setBuka] = useState<string | null>(null);

  const offset = new Date(tahun, bulan - 1, 1).getDay();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const hariKe = (d: number): string => HARI[new Date(tahun, bulan - 1, d).getDay()];
  const tanggal = (d: number): string => `${tahun}-${pad(bulan)}-${pad(d)}`;

  const shiftTerpilih = buka ? shiftList.find((s) => s.id === Number(nilai[buka])) : null;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {HARI.map((h) => (
          <div
            key={h}
            className="pb-1 text-center text-[11px] font-semibold text-gray-400">
            {h}
          </div>
        ))}

        {Array.from({ length: offset }).map((_, i) => (
          <div key={`kosong-${i}`} />
        ))}

        {Array.from({ length: hariDalamBulan }).map((_, i) => {
          const d = i + 1;
          const tgl = tanggal(d);
          const id = nilai[tgl];
          const s = id ? shiftList.find((x) => x.id === Number(id)) : null;
          const minggu = new Date(tahun, bulan - 1, d).getDay() === 0;
          const iniHari = tgl === todayKey;

          return (
            <button
              key={tgl}
              type="button"
              onClick={() => setBuka(tgl)}
              className={`flex min-h-[52px] flex-col items-center gap-1 rounded-xl border p-1 transition active:scale-[0.96] ${
                minggu
                  ? "border-red-100 bg-red-50/60"
                  : "border-gray-200 bg-white hover:border-blue-300"
              } ${iniHari ? "ring-2 ring-blue-500" : ""}`}>
              <span
                className={`text-xs font-semibold ${
                  minggu ? "text-red-500" : "text-gray-600"
                }`}>
                {d}
              </span>
              {s ? (
                <span
                  className={`w-full rounded-md px-1 py-0.5 text-center text-[9px] font-semibold leading-tight ${warnaKategori(s.kategori)}`}>
                  {s.kategori}
                </span>
              ) : (
                <span className="text-gray-300 text-xs leading-none">—</span>
              )}
            </button>
          );
        })}
      </div>

      {buka && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
          onClick={() => setBuka(null)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-md mx-auto p-6"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-center text-sm text-gray-500">
              {hariKe(Number(buka.slice(-2)))}, {buka.slice(8)}.
              {buka.slice(5, 7)}.{buka.slice(0, 4)}
            </h3>
            <h2 className="mb-4 text-center text-lg font-semibold text-gray-800">
              Pilih Shift
            </h2>

            {shiftTerpilih && (
              <div className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                <span className="font-medium">Saat ini:</span>
                <span className="font-semibold">{shiftTerpilih.kategori}</span>
                <span className="text-blue-500">
                  {shiftTerpilih.jam_masuk} - {shiftTerpilih.jam_pulang}
                </span>
              </div>
            )}

            <div className="space-y-2">
              {shiftList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(buka, String(s.id));
                    setBuka(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition active:scale-[0.99] ${
                    shiftTerpilih?.id === s.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}>
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-semibold ${warnaKategori(s.kategori)}`}>
                      {s.kategori}
                    </span>
                  </span>
                  <span className="text-gray-500">
                    {s.jam_masuk} - {s.jam_pulang}
                  </span>
                </button>
              ))}

              {nilai[buka] && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(buka, "");
                    setBuka(null);
                  }}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 active:scale-[0.99]">
                  <FaRegCalendarTimes />
                  Kosongkan tanggal ini
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setBuka(null)}
              className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}