import { FaCalendarDay } from "react-icons/fa6";
import type { WeekDay } from "../../utils/DateUtils";

export type WeekSliderItem = WeekDay & {
  jamMasuk: string | null;
  jamPulang: string | null;
  isOpen: boolean;
  isToday: boolean;
};

type props = {
  days: WeekSliderItem[];
  selected: string;
  onSelect: (tanggal: string) => void;
  openSession: { tanggal: string; label: string } | null;
  loading?: boolean;
};

export default function ShiftWeekSlider({ days, selected, onSelect, openSession, loading }: props) {
  return (
    <section className="w-full px-6 pt-3">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FaCalendarDay />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-800">Jadwal Minggu Ini</h1>
            <p className="text-xs text-gray-500">
              Pilih tanggal shift untuk melakukan absen pulang.
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {loading
            ? [0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex min-w-[76px] flex-col items-center gap-1 rounded-xl border border-gray-200 bg-gray-100 p-2"
                >
                  <span className="h-3 w-10 animate-pulse rounded bg-gray-300" />
                  <span className="h-3 w-10 animate-pulse rounded bg-gray-200" />
                </div>
              ))
            : days.map((d) => (
                <button
                  key={d.tanggal}
                  onClick={() => onSelect(d.tanggal)}
                  className={`flex min-w-[76px] cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 transition-colors duration-150 ${
                    selected === d.tanggal
                      ? "border-blue-600 bg-blue-50"
                      : d.isOpen
                        ? "border-amber-400 bg-amber-50"
                        : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      d.isToday ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {d.hari}
                    {d.isToday ? " •" : ""}
                  </span>
                  <span className="text-xs text-gray-700">{d.label}</span>
                  {d.isOpen ? (
                    <span className="w-fit rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                      Belum pulang
                    </span>
                  ) : d.jamMasuk ? (
                    <span className="text-[10px] text-gray-600">
                      {d.jamMasuk}
                      {d.jamPulang ? ` – ${d.jamPulang}` : ""}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">—</span>
                  )}
                </button>
              ))}
        </div>

        {openSession && selected !== openSession.tanggal && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Ada shift yang belum pulang pada {openSession.label}. Pilih tanggal itu lalu tekan
            Absen Pulang.
          </p>
        )}
      </div>
    </section>
  );
}