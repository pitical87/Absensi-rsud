import { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { BiCheckCircle } from "react-icons/bi";
import {
  HiOutlineArrowRight,
  HiOutlineCalendar,
  HiOutlineInformationCircle,
  HiOutlineSwitchHorizontal,
} from "react-icons/hi";
import { RiFileHistoryLine } from "react-icons/ri";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import {
  getPerubahanJadwalMenunggu,
  getRiwayatPersetujuanPerubahanJadwal,
  prosesPerubahanJadwal,
} from "../utils/api/PerubahanJadwal";
import type {
  MenungguPerubahanJadwal,
  RiwayatPersetujuanPerubahanJadwal,
} from "../types/PerubahanJadwalType";
import ConfirmModal from "../components/ConfirmModal";
import TopNavbar from "../components/Client Page/TopNavbar";
import { CardListSkeleton } from "../components/Skeleton";

type ApiErrorShape = {
  response?: { status?: number; data?: { pesan?: string } };
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

function formatTanggal(tgl: string): string {
  const bersih = tgl.slice(0, 10);
  const parts = bersih.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return tgl;
  const [y, m, d] = parts;
  return `${d} ${BULAN_SINGKAT[m] ?? m} ${y}`;
}

function formatTanggalWaktu(iso: string): string {
  const t = iso.includes("T") ? iso : iso.replace(" ", "T");
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth() + 1] ?? d.getMonth() + 1} ${d.getFullYear()} · ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_BADGE: Record<string, string> = {
  Disetujui: "bg-green-100 text-green-700",
  Ditolak: "bg-red-100 text-red-700",
  Menunggu: "bg-yellow-100 text-yellow-700",
};

function shiftBaruTeks(shift: MenungguPerubahanJadwal["shift_baru"]): string {
  if (!shift) return "—";
  return `${shift.kategori} (${shift.jam_masuk}–${shift.jam_pulang})`;
}

export default function PersetujuanPerubahanJadwal() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"menunggu" | "riwayat">(
    "menunggu",
  );
  const [daftar, setDaftar] = useState<MenungguPerubahanJadwal[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatPersetujuanPerubahanJadwal[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [catatanMap, setCatatanMap] = useState<Record<number, string>>({});
  const [confirm, setConfirm] = useState<{
    open: boolean;
    id: number;
    putusan: "setuju" | "tolak";
  }>({ open: false, id: 0, putusan: "setuju" });

  const refreshData = async () => {
    const [menungguSettled, riwayatSettled] = await Promise.allSettled([
      getPerubahanJadwalMenunggu(),
      getRiwayatPersetujuanPerubahanJadwal(),
    ]);

    if (
      (menungguSettled.status === "rejected" &&
        (menungguSettled.reason as ApiErrorShape)?.response?.status === 403) ||
      (riwayatSettled.status === "rejected" &&
        (riwayatSettled.reason as ApiErrorShape)?.response?.status === 403)
    ) {
      navigate("/", { replace: true });
      return;
    }

    if (menungguSettled.status === "fulfilled" && menungguSettled.value.sukses) {
      setDaftar(menungguSettled.value.data ?? []);
    }
    if (riwayatSettled.status === "fulfilled" && riwayatSettled.value.sukses) {
      setRiwayat(riwayatSettled.value.riwayat ?? []);
    }

    if (
      menungguSettled.status === "rejected" &&
      riwayatSettled.status === "rejected"
    ) {
      const pesan = (menungguSettled.reason as ApiErrorShape)?.response?.data
        ?.pesan;
      toast.error(pesan || "Gagal memuat data persetujuan.");
    } else if (menungguSettled.status === "rejected") {
      const pesan = (menungguSettled.reason as ApiErrorShape)?.response?.data
        ?.pesan;
      toast.error(pesan || "Gagal memuat daftar perubahan jadwal menunggu.");
    } else if (riwayatSettled.status === "rejected") {
      const pesan = (riwayatSettled.reason as ApiErrorShape)?.response?.data
        ?.pesan;
      toast.error(pesan || "Gagal memuat riwayat keputusan.");
    }
  };

  useEffect(() => {
    let aktif = true;
    Promise.allSettled([
      getPerubahanJadwalMenunggu(),
      getRiwayatPersetujuanPerubahanJadwal(),
    ])
      .then(([menungguSettled, riwayatSettled]) => {
        if (!aktif) return;

        if (
          (menungguSettled.status === "rejected" &&
            (menungguSettled.reason as ApiErrorShape)?.response?.status ===
              403) ||
          (riwayatSettled.status === "rejected" &&
            (riwayatSettled.reason as ApiErrorShape)?.response?.status === 403)
        ) {
          navigate("/", { replace: true });
          return;
        }

        if (
          menungguSettled.status === "fulfilled" &&
          menungguSettled.value.sukses
        ) {
          setDaftar(menungguSettled.value.data ?? []);
        }
        if (
          riwayatSettled.status === "fulfilled" &&
          riwayatSettled.value.sukses
        ) {
          setRiwayat(riwayatSettled.value.riwayat ?? []);
        }

        if (
          menungguSettled.status === "rejected" &&
          riwayatSettled.status === "rejected"
        ) {
          const pesan = (menungguSettled.reason as ApiErrorShape)?.response
            ?.data?.pesan;
          toast.error(pesan || "Gagal memuat data persetujuan.");
        } else if (menungguSettled.status === "rejected") {
          const pesan = (menungguSettled.reason as ApiErrorShape)?.response
            ?.data?.pesan;
          toast.error(pesan || "Gagal memuat daftar perubahan jadwal menunggu.");
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

  const handleProses = async () => {
    const { id, putusan } = confirm;
    setSubmittingId(id);
    try {
      const res = await prosesPerubahanJadwal({
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
        {/* Header Card (seragam dengan /persetujuan, /izin & /ubah-jadwal) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <HiOutlineSwitchHorizontal />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-800">
              Persetujuan Ubah Jadwal
            </h1>
            <p className="text-sm text-gray-500">
              Setujui atau tolak perubahan jadwal shift bawahan.
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
          aria-label="Menu Persetujuan Perubahan Jadwal"
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
                atau menolak pengajuan perubahan jadwal shift bawahan Anda.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold text-gray-800">
                    Menunggu Persetujuan
                  </h2>
                  <p className="text-xs text-gray-500">
                    Pengajuan ubah shift bawahan yang perlu diputuskan
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
                  Tidak ada pengajuan perubahan jadwal yang menunggu keputusan
                  Anda saat ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {daftar.map((item) => {
                    const busy = submittingId === item.id;
                    const unitTeks = item.pemohon.unit
                      ? item.pemohon.sub_unit
                        ? `${item.pemohon.unit} — ${item.pemohon.sub_unit}`
                        : item.pemohon.unit
                      : (item.pemohon.sub_unit ?? "—");

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                        {/* Identitas Pegawai & Tanggal */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 break-words">
                              {item.pemohon.nama}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500 break-words">
                              {unitTeks}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 whitespace-nowrap">
                            <HiOutlineCalendar className="text-sm shrink-0" />
                            {formatTanggal(item.tanggal)}
                          </span>
                        </div>

                        {/* Perubahan Shift */}
                        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs">
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
                            {item.shift_lama || "—"}
                          </span>
                          <HiOutlineArrowRight className="text-blue-500 shrink-0" />
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 ring-1 ring-blue-200">
                            {shiftBaruTeks(item.shift_baru)}
                          </span>
                        </div>

                        {/* Alasan */}
                        {item.alasan && (
                          <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                              Alasan
                            </p>
                            <p className="mt-0.5 text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                              {item.alasan}
                            </p>
                          </div>
                        )}

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
                    Daftar pengajuan jadwal yang telah Anda putuskan
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
                {riwayat.map((r) => (
                  <article
                    key={r.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2.5">
                    {/* Pemohon & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 break-words">
                          {r.pemohon}
                        </h3>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-600">
                          <HiOutlineCalendar className="shrink-0 text-blue-500 text-sm" />
                          {formatTanggal(r.tanggal)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                          STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-500"
                        }`}>
                        {r.status}
                      </span>
                    </div>

                    {/* Perubahan Shift */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded-md bg-white px-2 py-0.5 font-medium text-gray-600 ring-1 ring-gray-200">
                        {r.shift_lama || "—"}
                      </span>
                      <HiOutlineArrowRight className="text-blue-500 shrink-0" />
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 ring-1 ring-blue-200">
                        {r.shift_baru || "—"}
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
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={confirm.open}
        title={
          confirm.putusan === "setuju"
            ? "Setujui Perubahan Jadwal?"
            : "Tolak Perubahan Jadwal?"
        }
        message={
          confirm.putusan === "setuju"
            ? "Pengajuan perubahan jadwal akan disetujui dan shift pegawai pada tanggal tersebut akan diganti."
            : "Tolak pengajuan perubahan jadwal ini? Shift pegawai tetap seperti semula."
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
