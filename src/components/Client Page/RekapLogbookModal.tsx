import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BiCheckCircle, BiTimeFive } from "react-icons/bi";
import { FiX } from "react-icons/fi";
import { HiOutlineClipboardList } from "react-icons/hi";
import type { Bawahan } from "../../context/AuthContext";
import type {
  BawahanLogbookDetailResponse,
  BawahanLogbookEntry,
} from "../../types/LogBookType";
import {
  getLogbookBawahanDetail,
  verifikasiLogbookBawahan,
} from "../../utils/api/LogBook";
import { CardListSkeleton } from "../Skeleton";

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

const HARI_ID = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

type Props = {
  isOpen: boolean;
  bawahan: Bawahan[];
  bisaVerifikasi?: boolean;
  onClose: () => void;
};

function formatTanggalId(iso: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  const hari = HARI_ID[dt.getDay()] ?? "";
  const namaBulan = BULAN_ID[m - 1] ?? String(m);
  return `${hari}, ${String(d).padStart(2, "0")} ${namaBulan} ${y}`;
}

export default function RekapLogbookModal({
  isOpen,
  bawahan,
  bisaVerifikasi = false,
  onClose,
}: Props) {
  const now = new Date();
  const [selectedId, setSelectedId] = useState<number>(
    () => bawahan[0]?.id ?? 0,
  );
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());
  const [tanggal, setTanggal] = useState<string>(""); // "" = semua tanggal, atau "01".."31"

  const [reloadKey, setReloadKey] = useState(0);
  const [fetchResult, setFetchResult] = useState<{
    key: string;
    detail: BawahanLogbookDetailResponse | null;
    error: string | null;
  } | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const jumlahHariBulan = useMemo(
    () => new Date(tahun, bulan, 0).getDate(),
    [tahun, bulan],
  );

  // Reset tanggal jika melewati jumlah hari pada bulan/tahun baru
  const tanggalEfektif =
    tanggal !== "" && Number(tanggal) > jumlahHariBulan ? "" : tanggal;

  const requestKey = `${selectedId}-${bulan}-${tahun}-${reloadKey}`;

  useEffect(() => {
    if (!isOpen || !selectedId) return;
    let cancelled = false;
    getLogbookBawahanDetail(selectedId, bulan, tahun)
      .then((res) => {
        if (cancelled) return;
        if (res.sukses) {
          setFetchResult({ key: requestKey, detail: res, error: null });
        } else {
          setFetchResult({
            key: requestKey,
            detail: null,
            error: res.pesan || "Gagal memuat logbook pegawai.",
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const pesan = (
          err as { response?: { data?: { pesan?: string; message?: string } } }
        )?.response?.data;
        setFetchResult({
          key: requestKey,
          detail: null,
          error:
            pesan?.pesan || pesan?.message || "Gagal memuat logbook pegawai.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedId, bulan, tahun, requestKey]);

  const loading = Boolean(isOpen && selectedId && fetchResult?.key !== requestKey);
  const detail = fetchResult?.key === requestKey ? fetchResult.detail : null;
  const errorMsg = fetchResult?.key === requestKey ? fetchResult.error : null;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const dataPerTanggal = useMemo(() => detail?.data ?? {}, [detail]);

  const tanggalKeys = useMemo(() => {
    const keys = Object.keys(dataPerTanggal).sort((a, b) => (a < b ? 1 : -1));
    if (tanggalEfektif === "") return keys;
    const targetIso = `${tahun}-${String(bulan).padStart(2, "0")}-${tanggalEfektif}`;
    return keys.filter((k) => k === targetIso);
  }, [dataPerTanggal, tanggalEfektif, tahun, bulan]);

  const ringkasanTampil = useMemo(() => {
    let total = 0;
    let terverifikasi = 0;
    for (const key of tanggalKeys) {
      const list = dataPerTanggal[key] ?? [];
      total += list.length;
      for (const item of list) {
        if (item.is_verified) terverifikasi++;
      }
    }
    return {
      total,
      hari: tanggalKeys.length,
      terverifikasi,
      belum: Math.max(0, total - terverifikasi),
    };
  }, [tanggalKeys, dataPerTanggal]);

  if (!isOpen) return null;

  const handleToggleVerifikasi = async (
    isoDate: string,
    entry: BawahanLogbookEntry,
  ) => {
    if (!selectedId || verifyingId !== null) return;
    const aksi = entry.is_verified ? "batal" : "verifikasi";
    setVerifyingId(entry.id);
    try {
      const res = await verifikasiLogbookBawahan([entry.id], aksi, selectedId);
      if (res.sukses) {
        toast.success(res.pesan);
        setFetchResult((prev) => {
          if (!prev || !prev.detail) return prev;
          const current = prev.detail;
          const updatedList = (current.data[isoDate] ?? []).map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  is_verified: aksi === "verifikasi",
                }
              : item,
          );
          const delta = aksi === "verifikasi" ? 1 : -1;
          return {
            ...prev,
            detail: {
              ...current,
              terverifikasi: Math.max(0, current.terverifikasi + delta),
              belum: Math.max(0, current.belum - delta),
              data: {
                ...current.data,
                [isoDate]: updatedList,
              },
            },
          };
        });
      } else {
        toast.error(res.pesan || "Gagal memperbarui verifikasi.");
      }
    } catch (err: unknown) {
      const pesan = (
        err as { response?: { data?: { pesan?: string; message?: string } } }
      )?.response?.data;
      toast.error(pesan?.pesan || pesan?.message || "Gagal memperbarui verifikasi.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rekap-logbook-title"
      onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <HiOutlineClipboardList size={20} />
            </div>
            <div>
              <h2
                id="rekap-logbook-title"
                className="text-base font-semibold text-gray-900">
                Rekap Logbook
              </h2>
              <p className="text-xs text-gray-500">
                Lihat logbook aktivitas harian bawahan secara langsung
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="space-y-3 border-b border-gray-100 px-5 py-3.5">
          {/* Pilih Bawahan */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="rekap-logbook-bawahan"
              className="text-xs font-medium text-gray-600">
              Pilih Bawahan
            </label>
            <select
              id="rekap-logbook-bawahan"
              value={selectedId}
              disabled={bawahan.length === 0}
              onChange={(e) => {
                setSelectedId(Number(e.target.value));
                setTanggal("");
              }}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:bg-gray-50">
              {bawahan.length === 0 ? (
                <option value={0}>Belum ada data bawahan</option>
              ) : (
                bawahan.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Bulan, Tahun & Tanggal */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="rekap-logbook-bulan"
                className="text-xs font-medium text-gray-600">
                Bulan
              </label>
              <select
                id="rekap-logbook-bulan"
                value={bulan}
                onChange={(e) => {
                  setBulan(Number(e.target.value));
                  setTanggal("");
                }}
                className="rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
                {BULAN_ID.map((namaBulan, index) => (
                  <option key={namaBulan} value={index + 1}>
                    {namaBulan}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="rekap-logbook-tahun"
                className="text-xs font-medium text-gray-600">
                Tahun
              </label>
              <input
                id="rekap-logbook-tahun"
                type="number"
                value={tahun}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 2000 && val <= now.getFullYear() + 1) {
                    setTahun(val);
                    setTanggal("");
                  }
                }}
                min={2020}
                max={now.getFullYear() + 1}
                className="rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="rekap-logbook-tanggal"
                className="text-xs font-medium text-gray-600">
                Tanggal
              </label>
              <select
                id="rekap-logbook-tanggal"
                value={tanggalEfektif}
                onChange={(e) => setTanggal(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
                <option value="">Semua</option>
                {Array.from({ length: jumlahHariBulan }, (_, i) => {
                  const pad = String(i + 1).padStart(2, "0");
                  const iso = `${tahun}-${String(bulan).padStart(2, "0")}-${pad}`;
                  const count = dataPerTanggal[iso]?.length ?? 0;
                  return (
                    <option key={pad} value={pad}>
                      {pad}
                      {count > 0 ? ` (${count})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Ringkasan Singkat */}
          {!loading && !errorMsg && detail && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-medium">
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-700">
                {ringkasanTampil.total} kegiatan
              </span>
              <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-violet-700">
                {ringkasanTampil.hari} hari
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700">
                {ringkasanTampil.terverifikasi} terverifikasi
              </span>
              {ringkasanTampil.belum > 0 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-700">
                  {ringkasanTampil.belum} belum
                </span>
              )}
            </div>
          )}
        </div>

        {/* Live Logbook List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {bawahan.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Belum ada bawahan langsung yang terdaftar.
            </p>
          ) : loading ? (
            <CardListSkeleton count={3} />
          ) : errorMsg ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-xs font-medium text-red-700">{errorMsg}</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-2.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700">
                Coba Lagi
              </button>
            </div>
          ) : tanggalKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-gray-400">
                {tanggalEfektif !== ""
                  ? `Tidak ada catatan logbook pada tanggal ${tanggalEfektif} ${BULAN_ID[bulan - 1]} ${tahun}.`
                  : `Belum ada catatan logbook pada bulan ${BULAN_ID[bulan - 1]} ${tahun}.`}
              </p>
              {tanggalEfektif !== "" && (
                <button
                  type="button"
                  onClick={() => setTanggal("")}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100">
                  Tampilkan Semua Tanggal
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tanggalKeys.map((isoDate) => {
                const items = dataPerTanggal[isoDate] ?? [];
                return (
                  <div key={isoDate} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-gray-700">
                        {formatTanggalId(isoDate)}
                      </h3>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                        {items.length} aktivitas
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 tabular-nums">
                              <BiTimeFive className="text-violet-500" />
                              {item.jam}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {item.is_verified ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                  <BiCheckCircle size={13} />
                                  Terverifikasi
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                  Belum Verifikasi
                                </span>
                              )}

                              {bisaVerifikasi && (
                                <button
                                  type="button"
                                  disabled={verifyingId === item.id}
                                  onClick={() =>
                                    handleToggleVerifikasi(isoDate, item)
                                  }
                                  className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition disabled:opacity-50 ${
                                    item.is_verified
                                      ? "border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                                      : "bg-violet-600 text-white hover:bg-violet-700"
                                  }`}>
                                  {verifyingId === item.id
                                    ? "..."
                                    : item.is_verified
                                      ? "Batal"
                                      : "Verifikasi"}
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-gray-800">
                            {item.isi}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
