import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BiCheckCircle, BiServer } from "react-icons/bi";
import { FiX } from "react-icons/fi";
import {
  cekSimrsId,
  getMappingSimrs,
  simpanMappingSimrs,
  tesMappingSimrs,
} from "../../utils/api/MappingSimrs";
import Spinner from "../Spinner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type HasilBadge = {
  tipe: "ok" | "warn" | "err";
  teks: string;
} | null;

export default function MappingSimrsModal({ isOpen, onClose }: Props) {
  const [loadingStatus, setLoadingStatus] = useState(isOpen);
  const [termapping, setTermapping] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [inputKode, setInputKode] = useState("");
  const [checking, setChecking] = useState(false);
  const [verifiedKode, setVerifiedKode] = useState<string | null>(null);
  const [hasilCheck, setHasilCheck] = useState<HasilBadge>(null);

  const [testing, setTesting] = useState(false);
  const [hasilTes, setHasilTes] = useState<HasilBadge>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getMappingSimrs()
      .then((res) => {
        if (cancelled) return;
        if (res.sukses) {
          setTermapping(res.termapping);
          setCurrentId(res.simrs_user_id);
          setInputKode(res.simrs_user_id ?? "");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const data = (
            err as { response?: { data?: { pesan?: string; message?: string } } }
          )?.response?.data;
          toast.error(
            data?.pesan ||
              data?.message ||
              "Gagal memuat status mapping SIMRS.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const handleTesKoneksi = async () => {
    setTesting(true);
    setHasilTes(null);
    try {
      const res = await tesMappingSimrs();
      if (!res.sukses) {
        setHasilTes({
          tipe: "err",
          teks: res.pesan || "Gagal terhubung ke database SIMRS.",
        });
      } else if (!res.data) {
        setHasilTes({
          tipe: "warn",
          teks: "ID SIMRS tidak ditemukan pada database SIMRS.",
        });
      } else {
        setHasilTes({
          tipe: "ok",
          teks: `Berhasil: ${res.data.nik} — ${res.data.nama}`,
        });
      }
    } catch {
      setHasilTes({ tipe: "err", teks: "Terjadi kesalahan jaringan." });
    } finally {
      setTesting(false);
    }
  };

  const handleCheck = async () => {
    const kode = inputKode.trim();
    if (!kode) {
      setVerifiedKode(null);
      setHasilCheck({ tipe: "err", teks: "Masukkan ID SIMRS terlebih dahulu." });
      return;
    }

    setChecking(true);
    setVerifiedKode(null);
    setHasilCheck(null);
    try {
      const res = await cekSimrsId(kode);
      if (!res.sukses) {
        setHasilCheck({
          tipe: "err",
          teks: res.pesan || "Gagal terhubung ke database SIMRS.",
        });
      } else if (!res.data) {
        setHasilCheck({
          tipe: "warn",
          teks: "ID tidak ditemukan pada database SIMRS.",
        });
      } else {
        setVerifiedKode(kode);
        setHasilCheck({
          tipe: "ok",
          teks: `${res.data.nik} — ${res.data.nama}`,
        });
      }
    } catch {
      setHasilCheck({ tipe: "err", teks: "Terjadi kesalahan jaringan." });
    } finally {
      setChecking(false);
    }
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    const kode = inputKode.trim();
    if (!kode || verifiedKode !== kode) return;

    setSaving(true);
    try {
      const res = await simpanMappingSimrs(kode);
      if (res.sukses) {
        toast.success(res.pesan || "Mapping akun SIMRS berhasil disimpan.");
        setTermapping(true);
        setCurrentId(res.simrs_user_id ?? kode);
        setHasilTes(null);
        setVerifiedKode(null);
      } else {
        toast.error(res.pesan || "Gagal menyimpan mapping SIMRS.");
      }
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { pesan?: string } } })
        ?.response?.data?.pesan;
      toast.error(pesan || "Gagal menyimpan mapping SIMRS.");
    } finally {
      setSaving(false);
    }
  };

  const badgeCls = (tipe: "ok" | "warn" | "err") =>
    tipe === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tipe === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mapping-simrs-title"
      onClick={() => {
        if (!saving) onClose();
      }}>
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-xl text-teal-600">
              <BiServer />
            </div>
            <div>
              <h2
                id="mapping-simrs-title"
                className="text-base font-semibold text-gray-900">
                Mapping SIMRS
              </h2>
              <p className="text-xs text-gray-500">
                Hubungkan akun absensi dengan akun SIMRS
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSimpan}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {/* Status saat ini */}
          {loadingStatus ? (
            <div className="flex justify-center py-6">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600" />
            </div>
          ) : termapping && currentId ? (
            <div className="space-y-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <BiCheckCircle />
                  TerMapping
                </span>
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTesKoneksi}
                  className="rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:opacity-60">
                  {testing ? "Memeriksa..." : "Tes Koneksi"}
                </button>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/80">
                  ID Akun SIMRS
                </p>
                <p className="mt-0.5 text-sm font-bold text-gray-800 break-all">
                  {currentId}
                </p>
              </div>
              {hasilTes && (
                <div
                  className={`rounded-xl border px-3 py-2 text-xs font-medium ${badgeCls(hasilTes.tipe)}`}>
                  {hasilTes.teks}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
              <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Belum di Mapping
              </span>
              <p className="mt-1.5 text-xs text-gray-600">
                Akun SIMRS Anda belum terhubung. Masukkan ID (NIK) sesuai
                database SIMRS di bawah lalu klik <strong>Check</strong>.
              </p>
            </div>
          )}

          {/* Input & Check ID SIMRS */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-mapping-simrs"
              className="block text-xs font-medium text-gray-600">
              {termapping ? "Ubah ID Akun SIMRS" : "ID Akun SIMRS"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="input-mapping-simrs"
                type="text"
                maxLength={100}
                autoComplete="off"
                value={inputKode}
                disabled={saving}
                onChange={(e) => {
                  setInputKode(e.target.value);
                  setVerifiedKode(null);
                  setHasilCheck(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCheck();
                  }
                }}
                placeholder="Masukkan NIK sesuai database SIMRS"
                className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                disabled={checking || saving}
                onClick={handleCheck}
                className="shrink-0 rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60">
                {checking ? "Cek..." : "Check"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Klik <strong>Check</strong> untuk memverifikasi ID dan menampilkan
              nama Anda di SIMRS sebelum menyimpan.
            </p>
          </div>

          {hasilCheck && (
            <div
              className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${badgeCls(hasilCheck.tipe)}`}>
              {hasilCheck.teks}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
              Tutup
            </button>
            <button
              type="submit"
              disabled={saving || !verifiedKode || verifiedKode !== inputKode.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
              {saving ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Mapping</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
