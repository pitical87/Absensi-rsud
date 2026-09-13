import { useEffect, useState } from "react";
import { BiCheckDouble, BiRefresh, BiServer } from "react-icons/bi";
import { HiOutlineClock } from "react-icons/hi";
import { IoCloudDownloadOutline } from "react-icons/io5";
import { LuInfo } from "react-icons/lu";
import { saveLogBulk, getLogbookSimrs } from "../../utils/api/LogBook";
import { formatTanggal } from "../../utils/LogBookHelpers";
import type { SimrsLogbookResponse } from "../../types/LogBookType";
import toast from "react-hot-toast";
import Spinner from "../Spinner";

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const tgl = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${tgl}`;
}

function offsetHari(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function awalBulan(): Date {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
}

const JENIS_OPTIONS = [
  { value: "", label: "Gabungan (Tindakan & Lab)" },
  { value: "tindakan", label: "Tindakan" },
  { value: "lab", label: "Laboratorium" },
];

export default function LogBookSimrs({ onSaved }: { onSaved: () => void }) {
  const [jenis, setJenis] = useState("");
  const [dari, setDari] = useState(() => toYmd(offsetHari(-6)));
  const [sampai, setSampai] = useState(() => toYmd(new Date()));
  const [kunci, setKunci] = useState(0);
  const [entries, setEntries] = useState<SimrsLogbookResponse["data"]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [totalTindakan, setTotalTindakan] = useState(0);
  const [totalLab, setTotalLab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [peringatan, setPeringatan] = useState<string[]>([]);
  const [pesan, setPesan] = useState<string | null>(null);

  useEffect(() => {
    getLogbookSimrs(dari, sampai, jenis || undefined)
      .then((res) => {
        if (res.sukses) {
          setEntries(res.data ?? []);
          setSelected([]);
          setPeringatan(res.peringatan ?? []);
          setPesan(null);
          setTotalTindakan(res.total_tindakan ?? 0);
          setTotalLab(res.total_lab ?? 0);
        } else {
          setEntries([]);
          setSelected([]);
          setPeringatan([]);
          setPesan(res.pesan ?? "Gagal mengambil data SIMRS.");
          setTotalTindakan(0);
          setTotalLab(0);
        }
      })
      .catch(() => {
        setEntries([]);
        setSelected([]);
        setPeringatan([]);
        setPesan("Gagal terhubung ke server. Silakan coba lagi.");
        setTotalTindakan(0);
        setTotalLab(0);
      })
      .finally(() => setLoading(false));
  }, [dari, sampai, jenis, kunci]);

  const muat = () => {
    setLoading(true);
    setKunci((k) => k + 1);
  };

  const setPreset = (mulai: Date, akhir: Date) => {
    setDari(toYmd(mulai));
    setSampai(toYmd(akhir));
    setLoading(true);
  };

  const toggle = (idx: number) =>
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );

  const toggleAll = (checked: boolean) =>
    setSelected(
      checked ? entries.map((_, i) => i) : [],
    );

  const semuaDipilih = entries.length > 0 && selected.length === entries.length;

  const importKeLogbook = async () => {
    const target = selected
      .map((i) => entries[i])
      .filter((e): e is (typeof entries)[number] => Boolean(e));
    if (target.length === 0) return;

    setImporting(true);
    try {
      for (let start = 0; start < target.length; start += 100) {
        const batch = target.slice(start, start + 100).map((e) => ({
          tanggal: e.tanggal,
          jam: e.jam,
          isi: e.isi.trim(),
        }));
        const res = await saveLogBulk({ entri: batch });
        if (!res.sukses) {
          toast.error(res.pesan ?? "Gagal menyimpan ke logbook.");
          setImporting(false);
          return;
        }
      }
      toast.success(
        `${target.length} entri dari SIMRS berhasil masuk logbook.`,
      );
      setSelected([]);
      onSaved();
    } catch {
      toast.error("Gagal menyimpan ke logbook. Silakan coba lagi.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="px-6 py-3 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="w-11 h-11 shrink-0 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
          <BiServer />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-gray-800">
            Logbook SIMRS
          </h1>
          <p className="text-sm text-gray-500">
            Ambil aktivitas tindakan & lab dari SIMRS untuk dimasukkan ke
            logbook.
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700">
        <LuInfo className="shrink-0 text-sm" />
        <p>
          Data diambil dari database SIMRS untuk akun Anda yang sudah
          dimapping. Asumsikan akses SIMRS sudah dikonfigurasi admin.
        </p>
      </div>

      {/* Filter */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Dari
            </label>
            <input
              type="date"
              value={dari}
              max={sampai}
              onChange={(e) => setDari(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Sampai
            </label>
            <input
              type="date"
              value={sampai}
              min={dari}
              onChange={(e) => setSampai(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreset(offsetHari(-6), new Date())}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
            7 Hari Terakhir
          </button>
          <button
            type="button"
            onClick={() => setPreset(awalBulan(), new Date())}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
            Bulan Ini
          </button>
          <select
            value={jenis}
            onChange={(e) => {
              setJenis(e.target.value);
              setLoading(true);
            }}
            className="ml-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            {JENIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={muat}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
          {loading ? (
            <>
              <Spinner className="h-4 w-4" />
              Memuat...
            </>
          ) : (
            <>
              <BiRefresh className="text-lg" />
              Muat Data SIMRS
            </>
          )}
        </button>
      </div>

      {/* Peringatan / Pesan */}
      {pesan && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pesan}
        </div>
      )}
      {peringatan.map((p, i) => (
        <div
          key={i}
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {p}
        </div>
      ))}

      {/* Hasil */}
      {!loading && entries.length > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          <span>
            {entries.length} aktivitas ·{" "}
            <strong>{totalTindakan}</strong> tindakan ·{" "}
            <strong>{totalLab}</strong> lab
          </span>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <input
              type="checkbox"
              checked={semuaDipilih}
              onChange={(e) => toggleAll(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            Pilih semua
          </label>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">
          Tidak ada aktivitas SIMRS pada rentang tersebut.
        </p>
      ) : (
        <ul className="flex flex-col gap-3 max-h-96 overflow-y-scroll">
          {entries.map((e, i) => (
            <li
              key={`${e.tanggal}-${e.jam}-${i}`}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <input
                type="checkbox"
                checked={selected.includes(i)}
                onChange={() => toggle(i)}
                className="mt-0.5 h-4 w-4 accent-blue-600"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    {formatTanggal(e.tanggal)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    <HiOutlineClock className="text-[11px]" />
                    {e.jam}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-800">{e.isi}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && entries.length > 0 && (
        <button
          type="button"
          onClick={importKeLogbook}
          disabled={selected.length === 0 || importing}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
          {importing ? (
            <>
              <Spinner className="h-4 w-4" />
              Menyimpan...
            </>
          ) : (
            <>
              <IoCloudDownloadOutline className="text-lg" />
              {selected.length === 0
                ? "Pilih aktivitas untuk diimport"
                : `Import ${selected.length} ke Logbook`}
            </>
          )}
        </button>
      )}

      {!loading && entries.length > 0 && (
        <p className="flex items-center gap-1 text-xs text-gray-400">
          <BiCheckDouble className="text-sm" />
          Setelah import selesai, Anda akan kembali ke tab Entri Manual untuk
          memeriksa catatan yang baru masuk.
        </p>
      )}
    </section>
  );
}