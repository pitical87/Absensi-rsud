import TopNavbar from "../components/Client Page/TopNavbar";
import { IoArrowBack, IoDocumentTextOutline } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlineInformationCircle,
  HiOutlinePaperClip,
} from "react-icons/hi";
import { useEffect, useState } from "react";
import { FaRegCheckCircle, FaRegTrashAlt } from "react-icons/fa";
import { RiFileHistoryLine } from "react-icons/ri";
import { createLeave, deleteLeave, getLeaves } from "../utils/api/Leave";
import { useForm, useWatch } from "react-hook-form";
import { TiDelete } from "react-icons/ti";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import { useNavigate } from "react-router";

type LeaveType = {
  id: number;
  jenis: "Izin" | "Sakit" | "Cuti" | "Dinas Luar";
  jenis_cuti?: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  lama_hari: number | null;
  keterangan: string;
  alamat_izin?: string | null;
  lampiran: string | null;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  tahap_aktif: number;
  nomor_surat: string | null;
  ttd_digital: boolean;
  created_at: string;
  persetujuan: {
    tahap: number;
    posisi_tahap: string;
    status: "Menunggu" | "Disetujui" | "Ditolak" | "Dilewati";
    oleh_nama: string | null;
    waktu: string | null;
  }[];
};

type FormValues = {
  jenis_pengajuan: string;
  jenis_cuti: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  alamat: string;
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
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [y, m, d] = parts;
  return `${d} ${BULAN_SINGKAT[m] ?? m} ${y}`;
}

function hitungDurasiHari(mulai: string, selesai: string): number {
  const start = new Date(`${mulai}T00:00:00`);
  const end = new Date(`${selesai}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(
    1,
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );
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

export default function IzinPage() {
  const { user, atasan } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    resetField,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      jenis_pengajuan: "Izin",
      jenis_cuti: "",
      tanggal_mulai: "",
      tanggal_selesai: "",
      alamat: "",
      alasan: "",
    },
  });

  const jenisPengajuan = useWatch({ control, name: "jenis_pengajuan" });
  const tanggalMulai = useWatch({ control, name: "tanggal_mulai" });
  const selesai = useWatch({ control, name: "tanggal_selesai" });

  const [activeTab, setActiveTab] = useState<"pengajuan" | "riwayat">(
    "pengajuan",
  );
  const [leaves, setLeaves] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (selesai && tanggalMulai && selesai < tanggalMulai) {
      setValue("tanggal_selesai", tanggalMulai);
    }
  }, [selesai, tanggalMulai, setValue]);

  useEffect(() => {
    if (jenisPengajuan !== "Cuti") {
      resetField("jenis_cuti");
    }
  }, [jenisPengajuan, resetField]);

  const refreshLeaves = async () => {
    try {
      const res = await getLeaves();
      if (res.sukses) {
        setLeaves(Array.isArray(res.izin) ? res.izin : []);
      }
    } catch {
      toast.error("Gagal memuat riwayat pengajuan izin.");
    }
  };

  useEffect(() => {
    let aktif = true;
    getLeaves()
      .then((res) => {
        if (!aktif) return;
        if (res.sukses) {
          setLeaves(Array.isArray(res.izin) ? res.izin : []);
        }
      })
      .catch(() => {
        if (aktif) toast.error("Gagal memuat riwayat pengajuan izin.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

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
    formData.append("jenis_pengajuan", data.jenis_pengajuan);
    formData.append("tanggal_mulai", data.tanggal_mulai);

    const tglSelesai = data.tanggal_selesai || data.tanggal_mulai;
    formData.append("tanggal_selesai", tglSelesai);

    if (data.jenis_pengajuan === "Cuti") {
      formData.append("jenis_cuti", data.jenis_cuti);
    }

    if (data.jenis_pengajuan === "Izin" || data.jenis_pengajuan === "Cuti") {
      formData.append("alamat", data.alamat);
    }

    formData.append("alasan", data.alasan);
    if (selectedFile) {
      formData.append("lampiran", selectedFile);
    }

    try {
      const res = await createLeave(formData);
      if (res.sukses) {
        toast.success(res.pesan);
        await refreshLeaves();
        setValue("tanggal_mulai", "");
        setValue("tanggal_selesai", "");
        setValue("jenis_cuti", "");
        setValue("alamat", "");
        setValue("alasan", "");
        removeFile();
        setActiveTab("riwayat");
      } else {
        toast.error(res.pesan || "Gagal mengirim pengajuan.");
      }
    } catch (err: unknown) {
      const pesan = (
        err as { response?: { data?: { pesan?: string } } }
      )?.response?.data?.pesan;
      toast.error(pesan || "Gagal mengirim pengajuan. Silakan coba lagi.");
    }
  };

  const onDelete = async (id: number) => {
    try {
      const res = await deleteLeave(id);
      if (res.sukses) {
        toast.success(res.pesan || "Pengajuan izin berhasil dibatalkan.");
        await refreshLeaves();
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

  const daftarAtasan = atasan ?? [];

  return (
    <>
      <TopNavbar />
      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Batalkan Pengajuan Izin?"
        message="Data pengajuan ini akan dihapus dan tidak dapat dikembalikan."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        onConfirm={() => {
          if (confirmDeleteId) onDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <section className="px-4 sm:px-6 py-2 flex flex-col gap-3 pb-6">
        {/* Header Card (seragam dengan halaman Lembur & Perubahan Jadwal) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <IoDocumentTextOutline />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-800">
              Izin / Cuti
            </h1>
            <p className="text-sm text-gray-500">
              Ajukan izin, sakit, cuti, atau dinas luar.
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

        {/* Tab Switcher: Pengajuan & Riwayat */}
        <div
          role="tablist"
          aria-label="Menu Izin"
          className="grid grid-cols-2 gap-1.5 rounded-2xl border border-gray-200 bg-gray-100 p-1">
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
            <IoDocumentTextOutline className="text-base shrink-0" />
            <span>Pengajuan</span>
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
            {!loading && leaves.length > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  activeTab === "riwayat"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-200 text-gray-600"
                }`}>
                {leaves.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Pengajuan */}
        {activeTab === "pengajuan" && (
          <>
            {/* Info Atasan Langsung */}
            <div className="bg-blue-50 rounded-2xl border border-blue-200 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-blue-700">
              <HiOutlineInformationCircle className="shrink-0 mt-0.5 text-base" />
              <p className="leading-relaxed">
                {daftarAtasan.length > 0 ? (
                  <>
                    Pengajuan akan dikirim untuk persetujuan atasan langsung:{" "}
                    <strong>
                      {daftarAtasan.map((a) => a.nama).join(", ")}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Anda belum memiliki atasan langsung; pengajuan akan
                    diteruskan ke <strong>Admin</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Form Pengajuan */}
            <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-gray-800">
              Form Pengajuan
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Isi data pengajuan sesuai keperluan Anda.
            </p>
          </div>

          {/* Jenis Pengajuan */}
          <div className="space-y-1.5">
            <label
              htmlFor="jenis_pengajuan"
              className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
              Jenis Pengajuan
            </label>
            <div className="relative">
              <select
                id="jenis_pengajuan"
                {...register("jenis_pengajuan")}
                className="appearance-none w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                {user?.status_pegawai === "PNS" && (
                  <option value="Cuti">Cuti</option>
                )}
                <option value="Dinas Luar">Dinas Luar</option>
              </select>
              <HiOutlineChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Jenis Cuti */}
          {jenisPengajuan === "Cuti" && (
            <div className="space-y-1.5">
              <label
                htmlFor="jenis_cuti"
                className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                Jenis Cuti
              </label>
              <div className="relative">
                <select
                  id="jenis_cuti"
                  {...register("jenis_cuti", {
                    required:
                      jenisPengajuan === "Cuti" && "Jenis cuti wajib dipilih",
                  })}
                  className="appearance-none w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">Pilih jenis cuti</option>
                  <option value="Cuti Tahunan">Cuti Tahunan</option>
                  <option value="Cuti Sakit">Cuti Sakit</option>
                  <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                  <option value="Cuti Karena Alasan Penting">
                    Cuti Karena Alasan Penting
                  </option>
                  <option value="Cuti Besar">Cuti Besar</option>
                  <option value="Cuti di Luar Tanggungan Negara">
                    Cuti di Luar Tanggungan Negara
                  </option>
                </select>
                <HiOutlineChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {errors.jenis_cuti && (
                <p className="text-red-500 text-xs">
                  {errors.jenis_cuti.message}
                </p>
              )}
            </div>
          )}

          {/* Tanggal Mulai & Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="tanggal_mulai"
                className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                Tanggal Mulai
              </label>
              <input
                id="tanggal_mulai"
                type="date"
                {...register("tanggal_mulai", {
                  required: "Tanggal mulai wajib diisi",
                })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {errors.tanggal_mulai && (
                <p className="text-red-500 text-xs">
                  {errors.tanggal_mulai.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tanggal_selesai"
                className="block text-sm font-medium text-gray-700">
                Tanggal Selesai
              </label>
              <input
                id="tanggal_selesai"
                type="date"
                min={tanggalMulai}
                {...register("tanggal_selesai")}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="text-gray-400 text-xs">
                Kosongkan bila hanya 1 hari
              </p>
            </div>
          </div>

          {/* Alamat */}
          {(jenisPengajuan === "Izin" || jenisPengajuan === "Cuti") && (
            <div className="space-y-1.5">
              <label
                htmlFor="alamat"
                className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                Alamat Selama Izin/Cuti
              </label>
              <textarea
                id="alamat"
                rows={2}
                placeholder="Masukkan alamat lengkap..."
                {...register("alamat", {
                  required:
                    (jenisPengajuan === "Izin" || jenisPengajuan === "Cuti") &&
                    "Alamat wajib diisi",
                })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {errors.alamat && (
                <p className="text-red-500 text-xs">{errors.alamat.message}</p>
              )}
            </div>
          )}

          {/* Alasan */}
          <div className="space-y-1.5">
            <label
              htmlFor="alasan"
              className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
              Alasan / Keperluan
            </label>
            <textarea
              id="alasan"
              rows={3}
              placeholder="Masukkan alasan atau keperluan..."
              {...register("alasan", {
                required: "Alasan/keperluan wajib diisi",
              })}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {errors.alasan && (
              <p className="text-red-500 text-xs">{errors.alasan.message}</p>
            )}
          </div>

          {/* Lampiran */}
          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">
              Lampiran <span className="text-xs text-gray-400">(opsional)</span>
            </span>
            <label
              htmlFor="lampiran"
              className="flex items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4 cursor-pointer transition hover:border-blue-500 hover:bg-blue-50">
              <HiOutlinePaperClip className="text-xl text-blue-500 shrink-0" />
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : "Pilih file lampiran"}
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, atau PDF (maks. 3 MB)
                </p>
              </div>
            </label>
            <input
              key={fileInputKey}
              id="lampiran"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />

            {previewUrl && (
              <div className="relative w-full max-h-48 overflow-hidden rounded-xl border border-gray-200">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-44 object-contain bg-gray-100"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  aria-label="Hapus lampiran"
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-base hover:bg-red-600">
                  <TiDelete />
                </button>
              </div>
            )}
            {selectedFile && !previewUrl && (
              <div className="flex items-center justify-between gap-2 bg-blue-50 rounded-xl px-3.5 py-2.5 border border-blue-200">
                <div className="flex items-center gap-2 min-w-0">
                  <IoDocumentTextOutline className="text-blue-500 text-lg shrink-0" />
                  <span className="truncate text-xs sm:text-sm text-blue-700">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="shrink-0 text-red-500 text-xs font-semibold hover:text-red-700">
                  Hapus
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
            <FaRegCheckCircle className="text-base" />
            <span>{isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}</span>
          </button>
            </form>
          </>
        )}

        {/* Tab Riwayat — Mobile Portrait Card List */}
        {activeTab === "riwayat" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shrink-0">
                <RiFileHistoryLine />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Riwayat Pengajuan Izin
                </h2>
                <p className="text-xs text-gray-500">
                  Daftar pengajuan izin &amp; status persetujuan
                </p>
              </div>
            </div>
            {!loading && leaves.length > 0 && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                {leaves.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : leaves.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center space-y-3">
              <p className="text-sm text-gray-400">
                Belum ada pengajuan izin.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("pengajuan")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                <IoDocumentTextOutline className="text-sm" />
                Buat Pengajuan
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => {
                const durasi =
                  leave.lama_hari ??
                  hitungDurasiHari(leave.tanggal_mulai, leave.tanggal_selesai);
                const samaHari = leave.tanggal_mulai === leave.tanggal_selesai;
                const labelJenis = leave.jenis_cuti || leave.jenis;

                return (
                  <article
                    key={leave.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
                    {/* Baris Atas: Jenis & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 break-words">
                          {labelJenis}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <HiOutlineCalendar className="shrink-0 text-blue-500 text-sm" />
                            {samaHari
                              ? formatTanggal(leave.tanggal_mulai)
                              : `${formatTanggal(leave.tanggal_mulai)} – ${formatTanggal(leave.tanggal_selesai)}`}
                          </span>
                          <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200 whitespace-nowrap">
                            {durasi} {leave.lama_hari ? "hr kerja" : "hari"}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={leave.status} />
                    </div>

                    {/* Keterangan & Alamat */}
                    <div className="space-y-1 rounded-xl bg-white px-3 py-2.5 border border-gray-100">
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                        {leave.keterangan}
                      </p>
                      {leave.alamat_izin && (
                        <p className="text-xs text-gray-500 break-words">
                          <span className="font-medium text-gray-600">
                            Alamat:
                          </span>{" "}
                          {leave.alamat_izin}
                        </p>
                      )}
                    </div>

                    {/* Alur Persetujuan (1 tahap Atasan Langsung / Admin) */}
                    {(() => {
                      const tahapAktif = (leave.persetujuan ?? []).filter(
                        (p) => p.status !== "Dilewati",
                      );
                      const terakhir = tahapAktif[tahapAktif.length - 1];
                      const labelPenyetuju =
                        terakhir?.posisi_tahap === "Admin"
                          ? "Admin"
                          : daftarAtasan.length > 0
                            ? "Atasan Langsung"
                            : "Admin";
                      const statusPersetujuan =
                        terakhir?.status ?? leave.status;
                      const namaPenyetuju = terakhir?.oleh_nama;

                      return (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-[11px] font-medium text-gray-400 mr-0.5">
                            Persetujuan:
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-700">
                            {labelPenyetuju}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${
                              statusPersetujuan === "Disetujui"
                                ? "bg-green-100 text-green-700"
                                : statusPersetujuan === "Ditolak"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}>
                            {statusPersetujuan}
                          </span>
                          {namaPenyetuju && (
                            <span className="text-gray-500">
                              oleh {namaPenyetuju}
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Aksi & Lampiran */}
                    {(leave.lampiran || leave.status === "Menunggu") && (
                      <div className="flex items-center justify-between gap-2 border-t border-gray-200/80 pt-2.5">
                        <div>
                          {leave.lampiran && (
                            <a
                              href={getLampiranUrl(leave.lampiran)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100">
                              <HiOutlinePaperClip className="text-sm" />
                              Lihat Lampiran
                            </a>
                          )}
                        </div>

                        {leave.status === "Menunggu" && (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(leave.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 active:scale-95">
                            <FaRegTrashAlt className="text-xs" />
                            Batalkan
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
        )}
      </section>
    </>
  );
}
