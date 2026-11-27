import TopNavbar from "../components/Client Page/TopNavbar";
import { IoArrowBack, IoDocumentTextOutline } from "react-icons/io5";
import {
  HiOutlineCalendar,
  HiOutlineInformationCircle,
  HiOutlinePaperClip,
} from "react-icons/hi";
import { useEffect, useState } from "react";
import { FaRegCheckCircle, FaRegTrashAlt, FaStar } from "react-icons/fa";
import { RiFileHistoryLine } from "react-icons/ri";
import { useForm } from "react-hook-form";
import { TiDelete } from "react-icons/ti";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import Skeleton from "../components/Skeleton";
import { useNavigate } from "react-router";
import {
  ajukanLupaAbsen,
  batalLupaAbsen,
  getLupaAbsenList,
} from "../utils/api/LupaAbsen";
import type {
  PengajuanLupaAbsenItem,
  TanggalAlpaItem,
} from "../types/LupaAbsenType";

type FormValues = {
  tanggal: string;
  alasan: string;
  lampiran: FileList;
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
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  return `${d} ${BULAN_SINGKAT[m] ?? m} ${y}`;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Disetujui"
      ? "bg-green-100 text-green-700"
      : status === "Ditolak"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function LupaAbsenPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"pengajuan" | "riwayat">(
    "pengajuan",
  );
  const [loading, setLoading] = useState(true);
  const [tanggalAlpa, setTanggalAlpa] = useState<TanggalAlpaItem[]>([]);
  const [riwayat, setRiwayat] = useState<PengajuanLupaAbsenItem[]>([]);
  const [atasanNama, setAtasanNama] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      tanggal: "",
      alasan: "",
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const refreshData = async () => {
    try {
      const res = await getLupaAbsenList();
      if (res.sukses) {
        const list = res.tanggal_alpa ?? [];
        setTanggalAlpa(list);
        setRiwayat(res.riwayat ?? []);
        setAtasanNama(res.atasan_langsung ?? []);
        const tersedia = list.find((t) => !t.sudah_diajukan);
        if (tersedia) {
          setValue("tanggal", tersedia.tanggal);
        } else {
          setValue("tanggal", "");
        }
      }
    } catch {
      toast.error("Gagal memuat data lupa absen.");
    }
  };

  useEffect(() => {
    let aktif = true;
    getLupaAbsenList()
      .then((res) => {
        if (!aktif) return;
        if (res.sukses) {
          const list = res.tanggal_alpa ?? [];
          setTanggalAlpa(list);
          setRiwayat(res.riwayat ?? []);
          setAtasanNama(res.atasan_langsung ?? []);
          const tersedia = list.find((t) => !t.sudah_diajukan);
          if (tersedia) {
            setValue("tanggal", tersedia.tanggal);
          }
        }
      })
      .catch(() => {
        if (aktif) toast.error("Gagal memuat data lupa absen.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileInputKey((k) => k + 1);
  };

  const getLampiranUrl = (path: string) =>
    `${import.meta.env.VITE_API_URL?.replace("/api/mobile", "") || ""}/storage/${path}`;

  const onSubmit = async (data: FormValues) => {
    const formData = new FormData();
    formData.append("tanggal", data.tanggal);
    formData.append("alasan", data.alasan);
    if (selectedFile) {
      formData.append("lampiran", selectedFile);
    }

    try {
      const res = await ajukanLupaAbsen(formData);
      if (res.sukses) {
        toast.success(res.pesan);
        reset({ tanggal: "", alasan: "" });
        removeFile();
        await refreshData();
        setActiveTab("riwayat");
      } else {
        toast.error(res.pesan || "Gagal mengirim pengajuan lupa absen.");
      }
    } catch (err: unknown) {
      const pesan = (
        err as { response?: { data?: { pesan?: string } } }
      )?.response?.data?.pesan;
      toast.error(pesan || "Gagal mengirim pengajuan. Silakan coba lagi.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await batalLupaAbsen(id);
      if (res.sukses) {
        toast.success(res.pesan);
        await refreshData();
      } else {
        toast.error(res.pesan || "Gagal membatalkan pengajuan.");
      }
    } catch (err: unknown) {
      const pesan = (
        err as { response?: { data?: { pesan?: string } } }
      )?.response?.data?.pesan;
      toast.error(pesan || "Gagal membatalkan pengajuan.");
    }
  };

  const tanggalTersedia = tanggalAlpa.filter((t) => !t.sudah_diajukan);
  const pendingCount = riwayat.filter((r) => r.status === "Menunggu").length;

  return (
    <>
      <TopNavbar />
      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Batalkan Pengajuan Lupa Absen?"
        message="Pengajuan lupa absen ini akan dibatalkan dan dihapus."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <section className="px-4 sm:px-6 py-4 flex flex-col gap-4 max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
            <IoDocumentTextOutline />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-800">
              Ajukan Lupa Absen
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Pengajuan kehadiran untuk jadwal alpa dalam 1 bulan terakhir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Kembali"
            className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
            <IoArrowBack />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Menu Pengajuan Lupa Absen"
          className="grid grid-cols-2 gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pengajuan"}
            onClick={() => setActiveTab("pengajuan")}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              activeTab === "pengajuan"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-gray-600 hover:text-gray-800"
            }`}>
            <FaRegCheckCircle />
            <span>Pengajuan</span>
            {tanggalTersedia.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {tanggalTersedia.length}
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
            <RiFileHistoryLine />
            <span>Riwayat</span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : activeTab === "pengajuan" ? (
          <div className="flex flex-col gap-4">
            {/* Info ketentuan */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-800 flex items-start gap-3">
              <HiOutlineInformationCircle className="text-lg shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p>
                  Pengajuan akan dikirimkan notifikasi ke{" "}
                  <strong>atasan langsung</strong>
                  {atasanNama.length > 0 ? ` (${atasanNama.join(", ")})` : ""}{" "}
                  dan <strong>admin</strong> untuk diverifikasi.
                </p>
                <p className="text-amber-700">
                  Setelah diverifikasi, kehadiran tersimpan tanpa foto &amp;
                  tanpa koordinat dengan <strong>bintang 1</strong> untuk absen
                  masuk dan absen pulang.
                </p>
              </div>
            </div>

            {tanggalAlpa.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
                <p className="text-sm font-semibold text-gray-700">
                  Tidak ada jadwal alpa dalam 1 bulan terakhir.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Semua hari terjadwal Anda sudah tercatat hadir atau memiliki
                  izin yang disetujui.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
                {/* Pilih tanggal alpa */}
                <div className="space-y-2">
                  <label
                    htmlFor="tanggal-lupa-absen"
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <HiOutlineCalendar className="text-amber-600" />
                    Tanggal Tidak Absen / Alpa
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="tanggal-lupa-absen"
                    {...register("tanggal", {
                      required: "Pilih tanggal lupa absen terlebih dahulu.",
                    })}
                    disabled={tanggalTersedia.length === 0}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400">
                    <option value="">
                      {tanggalTersedia.length === 0
                        ? "Semua tanggal alpa sedang menunggu verifikasi"
                        : "-- Pilih tanggal alpa --"}
                    </option>
                    {tanggalAlpa.map((item) => (
                      <option
                        key={item.tanggal}
                        value={item.tanggal}
                        disabled={item.sudah_diajukan}>
                        {item.hari}, {formatTanggal(item.tanggal)}
                        {item.shift
                          ? ` — Shift ${item.shift.kategori} (${item.shift.jam_masuk}–${item.shift.jam_pulang})`
                          : ""}
                        {item.sudah_diajukan ? " [Menunggu Verifikasi]" : ""}
                      </option>
                    ))}
                  </select>
                  {errors.tanggal && (
                    <p className="text-xs text-red-500">
                      {errors.tanggal.message}
                    </p>
                  )}

                  {/* Ringkasan tanggal alpa */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tanggalAlpa.map((item) => (
                      <span
                        key={item.tanggal}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium ${
                          item.sudah_diajukan
                            ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}>
                        {formatTanggal(item.tanggal)}
                        {item.sudah_diajukan ? " · Menunggu" : " · Alpa"}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Alasan */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="alasan-lupa-absen"
                    className="block text-sm font-semibold text-gray-700">
                    Alasan / Keterangan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="alasan-lupa-absen"
                    rows={4}
                    placeholder="Jelaskan alasan lupa melakukan absen masuk/pulang..."
                    {...register("alasan", {
                      required: "Alasan wajib diisi.",
                      minLength: {
                        value: 5,
                        message: "Alasan minimal 5 karakter.",
                      },
                    })}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.alasan && (
                    <p className="text-xs text-red-500">
                      {errors.alasan.message}
                    </p>
                  )}
                </div>

                {/* Lampiran opsional (seperti pada izin) */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <HiOutlinePaperClip className="text-gray-500" />
                    Lampiran Pendukung{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (Opsional · JPG/PNG/PDF maks. 3 MB)
                    </span>
                  </label>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Preview lampiran"
                            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                          />
                        )}
                        <span className="truncate text-xs font-medium text-gray-700">
                          {selectedFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        aria-label="Hapus lampiran"
                        className="text-xl text-red-500 hover:text-red-700">
                        <TiDelete />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || tanggalTersedia.length === 0}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmitting
                    ? "Mengirim Pengajuan..."
                    : "Kirim Pengajuan Lupa Absen"}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Tab Riwayat */
          <div className="space-y-3">
            {riwayat.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-sm text-gray-500">
                Belum ada riwayat pengajuan lupa absen.
              </div>
            ) : (
              riwayat.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {item.hari}, {formatTanggal(item.tanggal)}
                      </p>
                      {item.shift && (
                        <p className="text-xs text-gray-500">
                          Shift {item.shift.kategori} ({item.shift.jam_masuk}–
                          {item.shift.jam_pulang})
                        </p>
                      )}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {item.alasan}
                  </p>

                  {item.lampiran && (
                    <a
                      href={getLampiranUrl(item.lampiran)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                      <HiOutlinePaperClip />
                      Lihat lampiran
                    </a>
                  )}

                  {item.status === "Disetujui" && (
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                      <FaStar className="text-amber-500 shrink-0" />
                      <span>
                        Tercatat di kehadiran (tanpa foto &amp; koordinat,
                        bintang 1 masuk &amp; pulang).
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-gray-500">
                    <div>
                      {item.diproses_oleh ? (
                        <span>
                          Diproses oleh <strong>{item.diproses_oleh}</strong>
                          {item.catatan_keputusan
                            ? ` · "${item.catatan_keputusan}"`
                            : ""}
                        </span>
                      ) : (
                        <span>Menunggu verifikasi atasan langsung / admin</span>
                      )}
                    </div>
                    {item.status === "Menunggu" && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition">
                        <FaRegTrashAlt />
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </>
  );
}
