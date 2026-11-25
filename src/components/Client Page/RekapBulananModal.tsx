import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaFilePdf, FaSearch } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import type { Bawahan } from "../../context/AuthContext";
import { rekapBawahanPdf } from "../../utils/api/Attendence";
import Spinner from "../Spinner";

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

type Props = {
  isOpen: boolean;
  bawahan: Bawahan[];
  onClose: () => void;
};

async function bacaPesanErrorBlob(err: unknown): Promise<string | null> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as { pesan?: string; message?: string };
      return parsed.pesan ?? parsed.message ?? null;
    } catch {
      return null;
    }
  }
  if (data && typeof data === "object" && "pesan" in data) {
    const pesan = (data as { pesan?: unknown }).pesan;
    return typeof pesan === "string" ? pesan : null;
  }
  return null;
}

export default function RekapBulananModal({ isOpen, bawahan, onClose }: Props) {
  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [query, setQuery] = useState("");
  const [pilihan, setPilihan] = useState<number[]>(() =>
    bawahan.map((b) => b.id),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const daftarTampil =
    q === ""
      ? bawahan
      : bawahan.filter(
          (b) =>
            b.nama.toLowerCase().includes(q) ||
            b.email.toLowerCase().includes(q),
        );

  const semuaTerpilih =
    daftarTampil.length > 0 &&
    daftarTampil.every((b) => pilihan.includes(b.id));

  const togglePegawai = (id: number) => {
    setPilihan((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const togglePilihSemua = () => {
    const idTampil = daftarTampil.map((b) => b.id);
    setPilihan((prev) =>
      semuaTerpilih
        ? prev.filter((id) => !idTampil.includes(id))
        : [...new Set([...prev, ...idTampil])],
    );
  };

  const handleUnduhPdf = async () => {
    if (pilihan.length === 0) {
      toast.error("Pilih minimal satu pegawai.");
      return;
    }

    setLoading(true);
    try {
      const blob = await rekapBawahanPdf(bulan, tahun, pilihan);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const bulanPad = String(bulan).padStart(2, "0");
      link.href = url;
      link.download = `rekap-bulanan-${tahun}-${bulanPad}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success("PDF rekap bulanan berhasil diunduh.");
      onClose();
    } catch (err: unknown) {
      const pesan = await bacaPesanErrorBlob(err);
      toast.error(pesan || "Gagal membuat PDF rekap bulanan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rekap-bulanan-title"
      onClick={() => {
        if (!loading) onClose();
      }}>
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <FaFilePdf size={18} />
            </div>
            <div>
              <h2
                id="rekap-bulanan-title"
                className="text-base font-semibold text-gray-900">
                Rekap Bulanan
              </h2>
              <p className="text-xs text-gray-500">
                Daftar hadir &amp; logbook 1 bulan (PDF per pegawai)
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-5 py-4">
          {/* Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="rekap-bulanan-bulan"
                className="text-xs font-medium text-gray-600">
                Bulan
              </label>
              <select
                id="rekap-bulanan-bulan"
                value={bulan}
                disabled={loading}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {BULAN_ID.map((namaBulan, index) => (
                  <option key={namaBulan} value={index + 1}>
                    {namaBulan}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="rekap-bulanan-tahun"
                className="text-xs font-medium text-gray-600">
                Tahun
              </label>
              <input
                id="rekap-bulanan-tahun"
                type="number"
                value={tahun}
                disabled={loading}
                onChange={(e) => setTahun(Number(e.target.value))}
                min={2020}
                max={now.getFullYear() + 1}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Multi-select Bawahan */}
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600">
                Pilih Pegawai ({pilihan.length}/{bawahan.length})
              </span>
              <button
                type="button"
                disabled={loading || daftarTampil.length === 0}
                onClick={togglePilihSemua}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 disabled:text-gray-400">
                {semuaTerpilih ? "Lepas Semua" : "Pilih Semua"}
              </button>
            </div>

            {bawahan.length > 4 && (
              <div className="relative">
                <FaSearch className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-gray-400" />
                <input
                  type="text"
                  value={query}
                  disabled={loading}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto rounded-xl border border-gray-200 p-1.5">
              {daftarTampil.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  {bawahan.length === 0
                    ? "Belum ada data bawahan."
                    : "Pegawai tidak ditemukan."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {daftarTampil.map((b) => {
                    const terpilih = pilihan.includes(b.id);
                    return (
                      <li key={b.id}>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => togglePegawai(b.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
                            terpilih
                              ? "border-blue-300 bg-blue-50"
                              : "border-transparent hover:bg-gray-50"
                          }`}>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {b.nama}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {b.email}
                            </p>
                          </div>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                              terpilih
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 bg-white text-transparent"
                            }`}>
                            <FaCheck className="text-[10px]" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
            Batal
          </button>
          <button
            type="button"
            disabled={loading || pilihan.length === 0}
            onClick={handleUnduhPdf}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
            {loading ? (
              <>
                <Spinner />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <FaFilePdf size={14} />
                <span>Unduh PDF ({pilihan.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
