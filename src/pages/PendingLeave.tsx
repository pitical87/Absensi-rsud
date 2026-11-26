import { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { BiCheckCircle } from "react-icons/bi";
import {
  HiOutlineCalendar,
  HiOutlineInformationCircle,
  HiOutlinePaperClip,
} from "react-icons/hi";
import { RiFileHistoryLine } from "react-icons/ri";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import {
  getPendingLeaveDetails,
  getRiwayatPersetujuan,
  prosesIzin,
} from "../utils/api/Leave";
import ConfirmModal from "../components/ConfirmModal";
import TopNavbar from "../components/Client Page/TopNavbar";
import { CardListSkeleton } from "../components/Skeleton";

type ApiErrorShape = {
  response?: { status?: number; data?: { pesan?: string } };
};

type PendingIzin = {
  id: number;
  jenis: "Izin" | "Sakit" | "Cuti" | "Dinas Luar";
  jenis_cuti?: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  lama_hari: number | null;
  keterangan: string;
  alamat_izin?: string | null;
  lampiran: string | null;
  tahap_aktif: number;
  posisi_tahap?: string | null;
  created_at: string;
  user: {
    id: number;
    nama_lengkap: string;
    nip: string | null;
    unit_kerja?: { id: number; nama: string } | null;
    sub_unit?: { id: number; nama: string } | null;
  };
};

type RiwayatItem = {
  id: number;
  waktu: string | null;
  catatan: string | null;
  status: string;
  pengajuan: {
    id: number;
    jenis: string;
    jenis_cuti: string | null;
    tanggal_mulai: string;
    tanggal_selesai: string;
    nama_pemohon: string;
  };
};

const BULAN_SINGKAT = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatTanggal(iso: string): string {
  const bersih = iso.slice(0, 10);
  const parts = bersih.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  return `${d} ${BULAN_SINGKAT[m] ?? m} ${y}`;
}

function formatTanggalWaktu(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth() + 1] ?? d.getMonth() + 1} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

function hitungDurasiHari(mulai: string, selesai: string): number {
  const start = new Date(`${mulai.slice(0, 10)}T00:00:00`);
  const end = new Date(`${selesai.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(
    1,
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
}

const STATUS_BADGE: Record<string, string> = {
  Disetujui: "bg-green-100 text-green-700",
  Ditolak: "bg-red-100 text-red-700",
  Menunggu: "bg-yellow-100 text-yellow-700",
  Dilewati: "bg-gray-100 text-gray-500",
};

export default function PendingLeave() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"menunggu" | "riwayat">(
    "menunggu",
  );
  const [daftar, setDaftar] = useState<PendingIzin[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [catatanMap, setCatatanMap] = useState<Record<number, string>>({});
  const [confirm, setConfirm] = useState<{
    open: boolean;
    id: number;
    putusan: "setuju" | "tolak";
  }>({ open: false, id: 0, putusan: "setuju" });

  const refreshData = async () => {
    const [detailSettled, riwayatSettled] = await Promise.allSettled([
      getPendingLeaveDetails(),
      getRiwayatPersetujuan(),
    ]);

    if (detailSettled.status === "fulfilled" && detailSettled.value.sukses) {
      setDaftar(detailSettled.value.izin ?? []);
    }
    if (riwayatSettled.status === "fulfilled" && riwayatSettled.value.sukses) {
      setRiwayat(riwayatSettled.value.riwayat ?? []);
    }
    if (
      detailSettled.status === "rejected" &&
      riwayatSettled.status === "rejected"
    ) {
      const pesan = (detailSettled.reason as ApiErrorShape)?.response?.data
        ?.pesan;
      toast.error(pesan || "Gagal memuat data persetujuan.");
    } else if (detailSettled.status === "rejected") {
      const pesan = (detailSettled.reason as ApiErrorShape)?.response?.data
        ?.pesan;
      toast.error(pesan || "Gagal memuat daftar persetujuan menunggu.");
    } else if (riwayatSettled.status === "rejected") {
      const pesan = (riwayatSettled.reason as ApiErrorShape)?.response?.data
        ?.pesan;
      toast.error(pesan || "Gagal memuat riwayat keputusan.");
    }
  };

  useEffect(() => {
    let aktif = true;
    Promise.allSettled([getPendingLeaveDetails(), getRiwayatPersetujuan()])
      .then(([detailSettled, riwayatSettled]) => {
        if (!aktif) return;
        if (detailSettled.status === "fulfilled" && detailSettled.value.sukses) {
          setDaftar(detailSettled.value.izin ?? []);
        }
        if (
          riwayatSettled.status === "fulfilled" &&
          riwayatSettled.value.sukses
        ) {
          setRiwayat(riwayatSettled.value.riwayat ?? []);
        }
        if (
          (detailSettled.status === "rejected" &&
            (detailSettled.reason as ApiErrorShape)?.response?.status === 403) ||
          (riwayatSettled.status === "rejected" &&
            (riwayatSettled.reason as ApiErrorShape)?.response?.status === 403)
        ) {
          navigate("/", { replace: true });
          return;
        }
        if (
          detailSettled.status === "rejected" &&
          riwayatSettled.status === "rejected"
        ) {
          const pesan = (detailSettled.reason as ApiErrorShape)?.response?.data
            ?.pesan;
          toast.error(pesan || "Gagal memuat data persetujuan.");
        } else if (detailSettled.status === "rejected") {
          const pesan = (detailSettled.reason as ApiErrorShape)?.response?.data
            ?.pesan;
          toast.error(pesan || "Gagal memuat daftar persetujuan menunggu.");
        } else if (riwayatSettled.status === "rejected") {
          const pesan = (riwayatSettled.reason as ApiErrorShape)?.response?.data
            ?.pesan;
          toast.error(pesan || "Gagal memuat riwayat keputusan.");
        }
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });

    return () => {
      aktif = false;
    };
  }, [navigate]);

  const getLampiranUrl = (path: string) =>
    `${import.meta.env.VITE_API_URL?.replace("/api/mobile", "") || ""}/storage/${path}`;

  const handleProses = async () => {
    const { id, putusan } = confirm;
    setSubmittingId(id);
    try {
      const res = await prosesIzin({
        id,
        putusan,
        catatan: catatanMap[id] || undefined,
      });
      toast.success(res.pesan);
      setConfirm({ open: false, id: 0, putusan: "setuju" });
      setCatatanMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDaftar((prev) => prev.filter((i) => i.id !== id));
      await refreshData();
    } catch (err: unknown) {
      const pesan = (err as ApiErrorShape).response?.data?.pesan;
      toast.error(pesan || "Gagal memproses pengajuan.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <TopNavbar />

      <section className="px-4 sm:px-6 py-2 flex flex-col gap-3 pb-6">
        {/* Header Card (seragam dengan /izin & /ubah-jadwal) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <BiCheckCircle />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-800">
              Persetujuan Izin
            </h1>
            <p className="text-sm text-gray-500">
              Setujui atau tolak pengajuan izin bawahan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Kembali ke beranda"
            className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
            <IoArrowBack />
          </button>
        </div>

        {/* 2-Tab Switcher: Menunggu & Riwayat */}
        <div
          role="tablist"
          aria-label="Menu Persetujuan Izin"
          className="grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "menunggu"}
            onClick={() => setActiveTab("menunggu")}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              activeTab === "menunggu"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <BiCheckCircle className="text-base shrink-0" />
            <span>Menunggu</span>
            {!loading && daftar.length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  activeTab === "menunggu"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-amber-100/80 text-amber-700"
                }`}>
                {daftar.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "riwayat"}
            onClick={() => setActiveTab("riwayat")}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              activeTab === "riwayat"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <RiFileHistoryLine className="text-base shrink-0" />
            <span>Riwayat</span>
            {!loading && riwayat.length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  activeTab === "riwayat"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-200 text-gray-600"
                }`}>
                {riwayat.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Menunggu */}
        {activeTab === "menunggu" && (
          <>
            <div className="bg-blue-50 rounded-2xl border border-blue-200 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-blue-700">
              <HiOutlineInformationCircle className="shrink-0 mt-0.5 text-base" />
              <p className="leading-relaxed">
                Sebagai <strong>atasan langsung</strong>, Anda dapat menyetujui
                atau menolak pengajuan izin/cuti bawahan Anda.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold text-gray-800">
                    Menunggu Persetujuan
                  </h2>
                  <p className="text-xs text-gray-500">
                    Pengajuan bawahan yang perlu diputuskan
                  </p>
                </div>
                {!loading && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    {daftar.length} pengajuan
                  </span>
                )}
              </div>

              {loading ? (
                <CardListSkeleton count={2} />
              ) : daftar.length === 0 ? (
                <p className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                  Tidak ada pengajuan yang menunggu keputusan Anda saat ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {daftar.map((item) => {
                    const samaHari =
                      item.tanggal_mulai.slice(0, 10) ===
                      item.tanggal_selesai.slice(0, 10);
                    const durasi =
                      item.lama_hari ??
                      hitungDurasiHari(
                        item.tanggal_mulai,
                        item.tanggal_selesai,
                      );
                    const labelJenis = item.jenis_cuti || item.jenis;
                    const busy = submittingId === item.id;

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                        {/* Identitas Pegawai & Jenis */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 break-words">
                              {item.user.nama_lengkap}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500 break-words">
                              {item.user.unit_kerja?.nama ?? "—"}
                              {item.user.sub_unit?.nama
                                ? ` — ${item.user.sub_unit.nama}`
                                : ""}
                            </p>
                            {item.user.nip && (
                              <p className="text-[11px] text-gray-400">
                                NIP {item.user.nip}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {labelJenis}
                          </span>
                        </div>

                        {/* Tanggal & Durasi */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <HiOutlineCalendar className="shrink-0 text-blue-500 text-sm" />
                            {samaHari
                              ? formatTanggal(item.tanggal_mulai)
                              : `${formatTanggal(item.tanggal_mulai)} – ${formatTanggal(item.tanggal_selesai)}`}
                          </span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200 whitespace-nowrap">
                            {durasi} {item.lama_hari ? "hr kerja" : "hari"}
                          </span>
                        </div>

                        {/* Alasan, Alamat & Lampiran */}
                        <div className="space-y-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                            {item.keterangan}
                          </p>
                          {item.alamat_izin && (
                            <p className="text-xs text-gray-500 break-words">
                              <span className="font-medium text-gray-600">
                                Alamat:
                              </span>{" "}
                              {item.alamat_izin}
                            </p>
                          )}
                          {item.lampiran && (
                            <div className="pt-1">
                              <a
                                href={getLampiranUrl(item.lampiran)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100">
                                <HiOutlinePaperClip className="text-sm" />
                                Lihat Lampiran
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Catatan & Tombol Aksi */}
                        <div className="space-y-2.5 pt-0.5">
                          <textarea
                            rows={2}
                            placeholder="Catatan keputusan (opsional)..."
                            value={catatanMap[item.id] ?? ""}
                            onChange={(e) =>
                              setCatatanMap((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            disabled={busy}
                            className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                          />
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setConfirm({
                                  open: true,
                                  id: item.id,
                                  putusan: "tolak",
                                })
                              }
                              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 active:scale-[0.98] disabled:opacity-50">
                              Tolak
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setConfirm({
                                  open: true,
                                  id: item.id,
                                  putusan: "setuju",
                                })
                              }
                              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50">
                              Setujui
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab Riwayat */}
        {activeTab === "riwayat" && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shrink-0">
                  <RiFileHistoryLine />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    Riwayat Keputusan Saya
                  </h2>
                  <p className="text-xs text-gray-500">
                    Daftar pengajuan yang telah Anda putuskan
                  </p>
                </div>
              </div>
              {!loading && riwayat.length > 0 && (
                <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {riwayat.length}
                </span>
              )}
            </div>

            {loading ? (
              <CardListSkeleton count={3} />
            ) : riwayat.length === 0 ? (
              <p className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                Belum ada riwayat keputusan.
              </p>
            ) : (
              <div className="space-y-3">
                {riwayat.map((r) => {
                  const samaHari =
                    r.pengajuan.tanggal_mulai.slice(0, 10) ===
                    r.pengajuan.tanggal_selesai.slice(0, 10);
                  const labelJenis = r.pengajuan.jenis_cuti || r.pengajuan.jenis;

                  return (
                    <article
                      key={r.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2.5">
                      {/* Pemohon & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 break-words">
                            {r.pengajuan.nama_pemohon}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 ring-1 ring-blue-200">
                              {labelJenis}
                            </span>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <HiOutlineCalendar className="shrink-0 text-blue-500 text-sm" />
                              {samaHari
                                ? formatTanggal(r.pengajuan.tanggal_mulai)
                                : `${formatTanggal(r.pengajuan.tanggal_mulai)} – ${formatTanggal(r.pengajuan.tanggal_selesai)}`}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                            STATUS_BADGE[r.status] ??
                            "bg-gray-100 text-gray-500"
                          }`}>
                          {r.status}
                        </span>
                      </div>

                      {r.catatan && (
                        <p className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-gray-700 break-words">
                          <span className="font-medium text-gray-500">
                            Catatan:
                          </span>{" "}
                          {r.catatan}
                        </p>
                      )}

                      {r.waktu && (
                        <p className="text-[11px] text-gray-400">
                          Diputus pada {formatTanggalWaktu(r.waktu)}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirm.open}
        title={
          confirm.putusan === "setuju"
            ? "Setujui Pengajuan?"
            : "Tolak Pengajuan?"
        }
        message={
          confirm.putusan === "setuju"
            ? "Pengajuan izin ini akan disetujui."
            : "Tolak pengajuan izin ini?"
        }
        confirmLabel={
          confirm.putusan === "setuju" ? "Ya, Setujui" : "Ya, Tolak"
        }
        onConfirm={handleProses}
        onCancel={() => setConfirm({ open: false, id: 0, putusan: "setuju" })}
      />
    </>
  );
}
