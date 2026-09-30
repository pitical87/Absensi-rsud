import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import type { PegawaiJadwal } from "../../types/JadwalType";

type Props = {
  isOpen: boolean;
  pegawai: PegawaiJadwal[];
  sudahAdaJadwal: Set<number>;
  onPilih: (p: PegawaiJadwal) => void;
  onTutup: () => void;
};

export default function PegawaiPickerModal({
  isOpen,
  pegawai,
  sudahAdaJadwal,
  onPilih,
  onTutup,
}: Props) {
  const [q, setQ] = useState("");

  if (!isOpen) return null;

  const query = q.trim().toLowerCase();
  const hasil =
    query === ""
      ? pegawai
      : pegawai.filter(
          (p) =>
            p.nama_lengkap.toLowerCase().includes(query) ||
            (p.unit_nama ?? "").toLowerCase().includes(query) ||
            (p.sub_unit_nama ?? "").toLowerCase().includes(query),
        );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onTutup}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full max-w-md mx-auto max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Pilih Pegawai</h2>
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / unit..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {hasil.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              Belum ada pegawai aktif.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {hasil.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onPilih(p)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-blue-50 active:scale-[0.99]">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
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
                    {sudahAdaJadwal.has(p.id) && (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
                        Sudah ada
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onTutup}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}