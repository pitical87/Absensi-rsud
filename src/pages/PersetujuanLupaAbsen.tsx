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
  getLupaAbsenMenunggu,
  getRiwayatPersetujuanLupaAbsen,
  prosesLupaAbsen,
} from "../utils/api/LupaAbsen";
import type {
  LupaAbsenMenungguItem,
  RiwayatPersetujuanLupaAbsenItem,
} from "../types/LupaAbsenType";
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
  const parts = tgl.slice(0, 10).split("-").map(Number);
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

export default function PersetujuanLupaAbsen() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"menunggu" | "riwayat">(
    "menunggu",
  );
  const [daftar, setDaftar] = useState<LupaAbsenMenungguItem[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatPersetujuanLupaAbsenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [catatanMap, setCatatanMap] = useState<Record<number, string>>({});
  const [confirm, setConfirm] = useState<{
    open: boolean;
    id: number;
    putusan: "setuju" | "tolak";
  }>({ open: false, id: 0, putusan: "setuju" });

  const getLampiranUrl = (path: string) =>
    `${import.meta.env.VITE_API_URL?.replace("/api/mobile", "") || ""}/storage/${path}`;

  const refreshData = async () => {
    const [menungguSettled, riwayatSettled] = await Promise.allSettled([
      getLupaAbsenMenunggu(),
      getRiwayatPersetujuanLupaAbsen(),
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

    if (
      menungguSettled.status === "fulfilled" &&
      menungguSettled.value.sukses
    ) {
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
      toast.error(pesan || "Gagal memuat data persetujuan lupa absen.");
    }
  };

  useEffect(() => {
    let aktif = true;
    Promise.allSettled([
      getLupaAbsenMenunggu(),
      getRiwayatPersetujuanLupaAbsen(),
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
      const res = await prosesLupaAbsen({
        id,
        putusan,
        catatan: catatanMap[id] || undefined,
      });
      if (res.sukses) {
        toast.success(res.pesan);
        setConfirm({ open: false, id: 0, putusan: "setuju" });
        setCatatanMap((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setDaftar((prev) => prev.filter((item) => item.id !== id));
        await refreshData();
      } else {
        toast.error(res.pesan || "Gagal memproses pengajuan.");
      }
    } catch (err: unknown) {
      const pesan = (err as ApiErrorShape)?.response?.data?.pesan;
      toast.error(pesan || "Gagal memproses pengajuan.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <TopNavbar />

      <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6 py-4">
        {/* Header */}
        <section className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Persetujuan Lupa Absen
            </h1>
            <p className="text-xs text-slate-500">
              Verifikasi pengajuan lupa absen pegawai bawahan Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Kembali"
            className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
            <IoArrowBack />
          </button>
        </section>

        {/* Info */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex items-start gap-2.5">
          <HiOutlineInformationCircle className="text-base shrink-0 mt-0.5 text-amber-600" />
          <p>
            Pengajuan yang <strong>disetujui</strong> otomatis dicatat di data
            kehadiran pegawai tanpa foto dan tanpa koordinat, dengan{" "}
            <strong>bintang 1</strong> untuk absen masuk dan absen pulang.
          </p>
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Menu Persetujuan Lupa Absen"
          className="grid grid-cols-2 gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1">
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
            <BiCheckCircle className="text-base" />
            <span>Menunggu</span>
            {daftar.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
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
            <RiFileHistoryLine className="text-base" />
            <span>Riwayat</span>
          </button>
        </div>

        {loading ? (
          <CardListSkeleton count={3} />
        ) : activeTab === "menunggu" ? (
          <div className="space-y-3">
            {daftar.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Tidak ada pengajuan lupa absen yang menunggu verifikasi Anda
                saat ini.
              </div>
            ) : (
              daftar.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-800 text-sm sm:text-base">
                        {item.pemohon.nama}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {item.pemohon.unit ?? "—"}
                        {item.pemohon.sub_unit
                          ? ` — ${item.pemohon.sub_unit}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Menunggu
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <HiOutlineCalendar className="text-amber-600" />
                      <span>
                        {item.hari}, {formatTanggal(item.tanggal)}
                      </span>
                    </div>
                    {item.shift && (
                      <p className="text-slate-600">
                        Shift {item.shift.kategori} ({item.shift.jam_masuk}–
                        {item.shift.jam_pulang})
                      </p>
                    )}
                    {item.diajukan_pada && (
                      <p className="text-slate-400">
                        Diajukan {formatTanggalWaktu(item.diajukan_pada)}
                      </p>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-slate-700">
                    <span className="font-semibold text-slate-500 block text-[11px] uppercase tracking-wide mb-0.5">
                      Alasan
                    </span>
                    <p>{item.alasan}</p>
                    {item.lampiran && (
                      <a
                        href={getLampiranUrl(item.lampiran)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
                        <HiOutlinePaperClip />
                        Lihat lampiran
                      </a>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <textarea
                      rows={2}
                      placeholder="Catatan verifikasi (opsional)..."
                      value={catatanMap[item.id] ?? ""}
                      onChange={(e) =>
                        setCatatanMap((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      disabled={submittingId === item.id}
                      className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                    />
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        disabled={submittingId === item.id}
                        onClick={() =>
                          setConfirm({
                            open: true,
                            id: item.id,
                            putusan: "setuju",
                          })
                        }
                        className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                        Verifikasi &amp; Setujui
                      </button>
                      <button
                        type="button"
                        disabled={submittingId === item.id}
                        onClick={() =>
                          setConfirm({
                            open: true,
                            id: item.id,
                            putusan: "tolak",
                          })
                        }
                        className="rounded-xl bg-red-100 px-4 py-2.5 text-xs sm:text-sm font-semibold text-red-600 transition hover:bg-red-200 disabled:opacity-50">
                        Tolak
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {riwayat.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Belum ada riwayat keputusan lupa absen.
              </div>
            ) : (
              riwayat.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      {r.pemohon}
                    </p>
                    <p className="text-xs text-slate-600">
                      Tanggal alpa: <strong>{formatTanggal(r.tanggal)}</strong>
                      {r.shift
                        ? ` · Shift ${r.shift.kategori} (${r.shift.jam_masuk}–${r.shift.jam_pulang})`
                        : ""}
                    </p>
                    {r.catatan && (
                      <p className="text-xs text-slate-500">
                        Catatan: {r.catatan}
                      </p>
                    )}
                    {r.waktu && (
                      <p className="text-[11px] text-slate-400">
                        {formatTanggalWaktu(r.waktu)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-500"
                    }`}>
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirm.open}
        title={
          confirm.putusan === "setuju"
            ? "Verifikasi Pengajuan Lupa Absen?"
            : "Tolak Pengajuan Lupa Absen?"
        }
        message={
          confirm.putusan === "setuju"
            ? "Kehadiran pegawai pada tanggal tersebut akan langsung tersimpan tanpa foto dan tanpa koordinat, serta mendapat bintang 1 untuk absen masuk dan absen pulang."
            : "Pengajuan lupa absen ini akan ditolak dan tanggal tersebut tetap tercatat alpa."
        }
        confirmLabel={
          confirm.putusan === "setuju" ? "Ya, Verifikasi" : "Ya, Tolak"
        }
        onConfirm={handleProses}
        onCancel={() => setConfirm({ open: false, id: 0, putusan: "setuju" })}
      />
    </>
  );
}
