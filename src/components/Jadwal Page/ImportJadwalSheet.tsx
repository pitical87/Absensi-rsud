import toast from "react-hot-toast";
import type { ImportJadwalResponse } from "../../types/JadwalImportType";
import {
  downloadTemplateJadwal,
  importJadwal,
} from "../../utils/api/JadwalImport";
import ConfirmModal from "../ConfirmModal";
import { useState } from "react";
import {
  IoClose,
  IoDocumentTextOutline,
  IoWarningOutline,
} from "react-icons/io5";

type Props = {
  isOpen: boolean;
  bulan: number;
  tahun: number;
  labelPeriode: string;
  onClose: () => void;
  onImported: () => void;
};

const MAKSIMAL_BYTES = 10 * 1024 * 1024;
const EKSTENSI = [".xlsx", ".xls", ".csv"];
const pad = (n: number) => String(n).padStart(2, "0");

function pesanApi(err: unknown, fallback: string): string {
  const e = err as {
    response?: {
      data?: {
        pesan?: string;
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
  };
  const data = e?.response?.data;
  return data?.pesan ?? data?.errors?.file?.[0] ?? data?.message ?? fallback;
}

export default function ImportJadwalSheet({
  isOpen,
  bulan,
  tahun,
  labelPeriode,
  onClose,
  onImported,
}: Props) {
  const [berkas, setBerkas] = useState<File | null>(null);
  const [versiInput, setVersiInput] = useState(0);
  const [mengunduh, setMengunduh] = useState(false);
  const [mengimpor, setMengimpor] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [hasil, setHasil] = useState<ImportJadwalResponse | null>(null);

  if (!isOpen) return null;

  const kosongkanBerkas = () => {
    setBerkas(null);
    setVersiInput((v) => v + 1);
  };

  const tutup = () => {
    if (mengimpor) return;
    kosongkanBerkas();
    setHasil(null);
    onClose();
  };

  const pilihBerkas = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setHasil(null);

    if (!file) {
      setBerkas(null);
      return;
    }

    if (!EKSTENSI.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      toast.error("Format berkas harus .xlsx, .xls, atau .csv.");
      kosongkanBerkas();
      return;
    }

    if (file.size > MAKSIMAL_BYTES) {
      toast.error("Ukuran berkas maksimal 10 MB.");
      kosongkanBerkas();
      return;
    }

    setBerkas(file);
  };

  const unduhTemplate = async () => {
    setMengunduh(true);
    try {
      const nama = await downloadTemplateJadwal(bulan, tahun);
      toast.success(`Template ${nama} diunduh.`);
    } catch (err: unknown) {
      toast.error(pesanApi(err, "Gagal mengunduh template."));
    } finally {
      setMengunduh(false);
    }
  };

  const jalankanImport = async () => {
    if (!berkas || mengimpor) return;
    setMengimpor(true);
    try {
      const res = await importJadwal(berkas, bulan, tahun);
      setHasil(res);
      setKonfirmasi(false);
      kosongkanBerkas();
      if (res.sukses) onImported();
    } catch (err: unknown) {
      setKonfirmasi(false);
      toast.error(pesanApi(err, "Gagal mengimpor berkas."));
    } finally {
      setMengimpor(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center"
        onClick={tutup}>
        <div
          className="bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-3xl shadow-xl p-5 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Import Jadwal dari Excel
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Periode {labelPeriode}
              </p>
            </div>
            <button
              type="button"
              onClick={tutup}
              disabled={mengimpor}
              className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center text-lg hover:bg-gray-200 transition shrink-0 disabled:opacity-50">
              <IoClose />
            </button>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800 mb-4">
            <IoWarningOutline className="text-lg shrink-0" />
            <p>
              Jadwal <strong>{labelPeriode}</strong> untuk setiap pegawai yang
              ada di berkas akan <strong>diganti penuh</strong> oleh isi file.
              Pegawai yang tidak ada di file tidak tersentuh.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 p-3 mb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  1. Unduh template
                </p>
                <p className="text-xs text-gray-500 truncate">
                  template_jadwal_{tahun}-{pad(bulan)}.xlsx
                </p>
              </div>
              <button
                type="button"
                onClick={unduhTemplate}
                disabled={mengunduh}
                className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition disabled:opacity-50">
                {mengunduh ? "Mengunduh..." : "Unduh"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-3">
            <p className="text-sm font-medium text-gray-800 mb-2">
              2. Pilih berkas
            </p>
            <label
              htmlFor="berkas-jadwal"
              className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-3 py-4 hover:border-blue-400 hover:bg-blue-50 transition">
              <IoDocumentTextOutline className="text-xl text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  {berkas ? berkas.name : "Pilih berkas Excel"}
                </p>
                <p className="text-xs text-gray-500">
                  .xlsx, .xls, .csv · maks 10 MB
                </p>
              </div>
            </label>
            <input
              key={versiInput}
              id="berkas-jadwal"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={pilihBerkas}
            />
          </div>

          {hasil && (
            <div className="mt-4 space-y-3">
              <div
                className={`rounded-2xl border p-3 text-sm ${
                  hasil.sukses
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}>
                <p className="font-medium">{hasil.pesan}</p>
                {hasil.sukses && (
                  <p className="text-xs mt-1">
                    {hasil.pegawai} pegawai · {hasil.entri} entri jadwal
                  </p>
                )}
              </div>

              {(hasil.bulan !== bulan || hasil.tahun !== tahun) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Server memproses periode {hasil.bulan}/{hasil.tahun}. Nilai di
                  luar rentang ±3 tahun otomatis disesuaikan.
                </div>
              )}

              {hasil.galat.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-900">
                    {hasil.galat.length} catatan perlu ditinjau
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {hasil.galat.map((g, i) => (
                      <li
                        key={`${i}-${g}`}
                        className="flex gap-2 text-xs text-amber-900">
                        <span className="text-amber-500">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={tutup}
              disabled={mengimpor}
              className="flex-1 rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
              Tutup
            </button>
            <button
              type="button"
              onClick={() => setKonfirmasi(true)}
              disabled={!berkas || mengimpor || Boolean(hasil)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:bg-gray-300">
              {mengimpor ? "Mengimpor..." : "Import"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={konfirmasi}
        title="Ganti jadwal sebulan penuh?"
        message={`Seluruh jadwal ${labelPeriode} untuk pegawai yang ada di berkas akan diganti. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, import"
        cancelLabel="Batal"
        onConfirm={jalankanImport}
        onCancel={() => setKonfirmasi(false)}
      />
    </>
  );
}
