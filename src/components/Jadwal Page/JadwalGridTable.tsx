import { IoClose } from "react-icons/io5";
import type { PegawaiJadwal, ShiftOpsi } from "../../types/JadwalType";

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
const pad = (n: number) => String(n).padStart(2, "0");

function warnaKategori(k: string): string {
  return k === "Pagi"
    ? "bg-green-100 text-green-700 border-green-200"
    : k === "Siang"
      ? "bg-sky-100 text-sky-700 border-sky-200"
      : k === "Sore"
        ? "bg-orange-100 text-orange-700 border-orange-200"
        : k === "Malam"
          ? "bg-blue-100 text-blue-700 border-blue-200"
          : "bg-gray-100 text-gray-700 border-gray-200";
}

export default function JadwalGridTable({ pegawai, bulan, tahun, hariDalamBulan, shiftList, grid, onUbahSel, onIsiSemua, onHapus }: Props) {
  const hariKe = (d: number): string => HARI[new Date(tahun, bulan - 1, d).getDay()];

  const minggu = (d: number) => new Date(tahun, bulan - 1, d).getDay() === 0;

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="border-separate border-spacing-0 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 min-w-[180px] border-b border-gray-200 bg-white px-3 py-2 text-left font-semibold text-gray-700">Nama Pegawai</th>
            <th className="min-w-[70px] border-b border-gray-200 bg-white px-2 py-2 text-center font-semibold text-gray-500">Isi Semua</th>
            {Array.from({ length: hariDalamBulan }).map((_, i) => {
              const d = i + 1;
              return (
                <th key={d} title={hariKe(d)} className={`min-w-[52px] border-b border-gray-200 bg-white px-1 py-2 text-center font-semibold ${minggu(d) ? "text-red-500" : "text-gray-500"}`}>
                  {d}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {pegawai.map((p) => {
            const baris = grid[String(p.id)] ?? {};
            return (
              <tr key={p.id}>
                <td className="sticky left-0 z-10 border-b border-gray-100 bg-white px-1 py-1.5">
                  <div className="flex w-[130px] items-center gap-2">
                    <button type="button" onClick={() => onHapus(p.id)} title="Hapus baris ini" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-100 hover:text-red-600">
                      <IoClose />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p title={p.nama_lengkap} className="truncate text-sm font-medium text-gray-800">
                        {p.nama_lengkap}
                      </p>
                      {(p.unit_nama || p.sub_unit_nama) && <p className="truncate text-[11px] text-gray-500">{p.sub_unit_nama ? `${p.unit_nama ?? ""} — ${p.sub_unit_nama}` : p.unit_nama}</p>}
                    </div>
                  </div>
                </td>
                <td className="border-b border-gray-100 px-1 py-1 text-center">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) onIsiSemua(p.id, e.target.value);
                    }}
                    className="w-[62px] rounded-md border border-gray-300 bg-white px-1 py-0.5 text-[11px] text-gray-600 outline-none focus:border-blue-500"
                  >
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
                  const s = val ? shiftList.find((x) => x.id === Number(val)) : null;
                  return (
                    <td key={tgl} className={`border-b border-gray-100 p-0.5 text-center ${minggu(d) ? "bg-red-50/50" : ""}`}>
                      <select
                        value={val}
                        onChange={(e) => onUbahSel(p.id, tgl, e.target.value)}
                        className={`w-[48px] rounded-md border px-0.5 py-0.5 text-[11px] outline-none transition focus:border-blue-500 ${s ? warnaKategori(s.kategori) : "border-gray-200 bg-white text-gray-500"}`}
                      >
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
      </table>
    </div>
  );
}
