import TopNavbar from "../components/Client Page/TopNavbar";
import { IoArrowBack, IoDocumentTextOutline } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import { HiOutlineChevronDown, HiOutlinePaperClip } from "react-icons/hi";
import { useEffect, useRef, useState } from "react";
import { FaRegCheckCircle } from "react-icons/fa";
import { RiFileHistoryLine } from "react-icons/ri";
import { createLeave, deleteLeave, getLeaves } from "../utils/api/Leave";
import { useForm } from "react-hook-form";
import { TiDelete } from "react-icons/ti";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import { IoIosRemoveCircle } from "react-icons/io";
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

export default function IzinPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    resetField,
    setValue,
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
  const jenisPengajuan = watch("jenis_pengajuan");
  const tanggalMulai = watch("tanggal_mulai");
  const [leaves, setLeaves] = useState<LeaveType[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const lampiranRef = useRef<HTMLInputElement | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  // reset tanggal_selesai if it's before tanggal_mulai
  useEffect(() => {
    const selesai = watch("tanggal_selesai");
    if (selesai && tanggalMulai && selesai < tanggalMulai) {
      setValue("tanggal_selesai", tanggalMulai);
    }
  }, [tanggalMulai, watch, setValue]);

  // reset jenis_cuti when jenis_pengajuan is not "Cuti"
  useEffect(() => {
    if (jenisPengajuan !== "Cuti") {
      resetField("jenis_cuti");
    }
  }, [jenisPengajuan, resetField]);

  useEffect(() => {
    const fetcLeaves = async () => {
      try {
        const res = await getLeaves();
        console.log(res.izin);
        if (res.sukses) {
          setLeaves(res.izin);
        }
      } catch {
        // fallback ke user.shift dari auth context
      }
    };
    fetcLeaves();
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
    if (lampiranRef.current) {
      lampiranRef.current.value = "";
    }
  };

  const getLampiranUrl = (path: string) =>
    `${import.meta.env.VITE_API_URL?.replace("/api/mobile", "") || ""}/storage/${path}`;

  const onSubmit = async (data: FormValues) => {
    const formData = new FormData();
    formData.append("jenis_pengajuan", data.jenis_pengajuan);
    formData.append("tanggal_mulai", data.tanggal_mulai);

    const selesai = data.tanggal_selesai || data.tanggal_mulai;
    formData.append("tanggal_selesai", selesai);

    if (data.jenis_pengajuan === "Cuti") {
      formData.append("jenis_cuti", data.jenis_cuti);
    }

    if (data.jenis_pengajuan === "Izin" || data.jenis_pengajuan === "Cuti") {
      formData.append("alamat", data.alamat);
    }

    formData.append("alasan", data.alasan);
    const file = lampiranRef.current?.files?.[0];
    if (file) {
      formData.append("lampiran", file);
    }
    console.log(data);
    try {
      const res = await createLeave(formData);
      if (res.sukses) {
        toast.success(res.pesan);
        // refresh riwayat
        const updated = await getLeaves();
        if (updated.sukses) setLeaves(updated.izin);
        // reset form
        setValue("tanggal_mulai", "");
        setValue("tanggal_selesai", "");
        setValue("jenis_cuti", "");
        setValue("alamat", "");
        setValue("alasan", "");
      } else {
        toast.success(res.pesan);
      }
    } catch {
      toast.success("Gagal mengirim pengajuan. Silakan coba lagi.");
    }
  };

  const getLeaveDur = (leave: LeaveType): number => {
    if (leaves === null) return 0;

    const start = new Date(leave?.tanggal_mulai);
    const end = new Date(leave?.tanggal_selesai);

    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const onDelete = async (id: number) => {
    try {
      const res = await deleteLeave(id);
      if (res.sukses) {
        // refresh list
        const updated = await getLeaves();
        if (updated.sukses) setLeaves(updated.izin);
      } else {
        toast.success(res.pesan);
      }
    } catch {
      toast.success("Gagal membatalkan.");
    }
  };
  return (
    <>
      <TopNavbar />
      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Batalkan Pengajuan?"
        message="Data pengajuan ini akan dihapus dan tidak dapat dikembalikan."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        onConfirm={() => {
          if (confirmDeleteId) onDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <section className="px-6 py-2 flex flex-col gap-2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
              <IoDocumentTextOutline />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                Ajukan Izin
              </h1>
              <p className="text-sm text-gray-500">
                Isi data pengajuan sesuai kebutuhan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
              <IoArrowBack />
            </button>
          </div>
          {/* Jenis Pengajuan */}
          <div className="space-y-2">
            <label
              htmlFor="jenis_pengajuan"
              className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
              Jenis Pengajuan
            </label>
            <div className="relative">
              <select
                id="jenis_pengajuan"
                {...register("jenis_pengajuan")}
                className="appearance-none w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                {user?.status_pegawai === "PNS" && (
                  <option value="Cuti">Cuti</option>
                )}
                <option value="Dinas Luar">Dinas Luar</option>
              </select>
              <HiOutlineChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Jenis Cuti */}
          {jenisPengajuan === "Cuti" && (
            <div className="space-y-2">
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
                  })}>
                  <option value="">Pilih jenis cuti</option>
                  <option value="Cuti Tahunan">Cuti Tahunan</option>
                  <option value="Cuti Sakit">Cuti Sakit</option>
                  <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                  <option value="Cuti Karena Alasan Penting">
                    Cuti Karena Alasan Penting
                  </option>
                  <option value="Cuti Besar">Cuti Besar</option>
                  <option value="Cuti Diluar Tanggungan Negara">
                    Cuti Diluar Tanggungan Negara
                  </option>
                </select>
                <HiOutlineChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {errors.jenis_cuti && (
                <p className="text-red-500 text-xs">
                  {errors.jenis_cuti.message}
                </p>
              )}
            </div>
          )}

          {/* Tanggal Mulai */}
          <div className="space-y-2">
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {errors.tanggal_mulai && (
              <p className="text-red-500 text-xs">
                {errors.tanggal_mulai.message}
              </p>
            )}
          </div>

          {/* Tanggal Selesai */}
          <div className="space-y-2">
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
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <p className="text-gray-500 text-xs">Kosongkan bila hanya sehari</p>
          </div>

          {/* Alamat */}
          {(jenisPengajuan === "Izin" || jenisPengajuan === "Cuti") && (
            <div className="space-y-2">
              <label
                htmlFor="alamat"
                className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                Alamat Selama Izin/Cuti
              </label>
              <textarea
                id="alamat"
                rows={3}
                placeholder="Masukkan alamat lengkap..."
                {...register("alamat", {
                  required:
                    (jenisPengajuan === "Izin" || jenisPengajuan === "Cuti") &&
                    "Alamat wajib diisi",
                })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 outline-none transition resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {errors.alamat && (
                <p className="text-red-500 text-xs">{errors.alamat.message}</p>
              )}
            </div>
          )}

          {/* Alasan */}
          <div className="space-y-2">
            <label
              htmlFor="alasan"
              className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
              Alasan / Keperluan
            </label>
            <textarea
              id="alasan"
              rows={5}
              placeholder="Masukkan alasan atau keperluan..."
              {...register("alasan", {
                required: "Alasan/keperluan wajib diisi",
              })}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {errors.alasan && (
              <p className="text-red-500 text-xs">{errors.alasan.message}</p>
            )}
          </div>

          {/* Lampiran */}
          <div className="space-y-2">
            <label
              htmlFor="lampiran"
              className="flex items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 cursor-pointer transition hover:border-blue-500 hover:bg-blue-50">
              <HiOutlinePaperClip className="text-2xl text-blue-500" />
              <div className="text-center">
                <p className="font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : "Pilih file lampiran"}
                </p>
                <p className="text-sm text-gray-500">
                  PDF, JPG, PNG (maks. 5 MB)
                </p>
              </div>
            </label>
            <input
              id="lampiran"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              ref={lampiranRef}
              onChange={handleFileChange}
            />

            {previewUrl && (
              <div className="relative w-full max-h-48 overflow-hidden rounded-xl border border-gray-200">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-gray-100"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600">
                  <TiDelete />
                </button>
              </div>
            )}
            {selectedFile && !previewUrl && (
              <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 border border-blue-200">
                <div className="flex items-center gap-2">
                  <IoDocumentTextOutline className="text-blue-500 text-lg" />
                  <span className="text-sm text-blue-700">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-500 text-sm font-medium hover:text-red-700">
                  Hapus
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Foto surat sakit / surat tugas / surat keterangan — JPG, PNG, atau
              PDF maks 3 MB.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
              <FaRegCheckCircle className="text-lg" />
              <span>{isSubmitting ? "Mengirim..." : "Kirim Ajuan"}</span>
            </button>
          </div>
        </form>

        {/* Riwayat */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
              <RiFileHistoryLine />
            </div>
            Riwayat Pengajuan Izin
          </h1>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Jenis
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Lama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Keterangan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Alur Persetujuan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Lampiran
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {leaves?.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-t hover:bg-gray-50 transition">
                    <td className="px-4 py-3">{leave.jenis}</td>
                    <td className="px-4 py-3">
                      {leave.tanggal_mulai} - {leave.tanggal_selesai}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {leave.lama_hari ?? getLeaveDur(leave)} hari
                    </td>
                    <td className="px-4 py-3">{leave.keterangan}</td>
                    <td className="px-4 py-3">
                      {leave.persetujuan && leave.persetujuan.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {leave.persetujuan.map((p) => (
                            <div
                              key={p.tahap}
                              className="flex items-center gap-2 text-sm">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                {p.posisi_tahap}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  p.status === "Disetujui"
                                    ? "bg-green-100 text-green-700"
                                    : p.status === "Ditolak"
                                      ? "bg-red-100 text-red-700"
                                      : p.status === "Dilewati"
                                        ? "bg-gray-100 text-gray-500"
                                        : "bg-yellow-100 text-yellow-700"
                                }`}>
                                {p.status}
                              </span>
                              {p.oleh_nama && (
                                <span className="text-gray-400 text-xs">
                                  — {p.oleh_nama}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : leave.status === "Disetujui" ||
                        leave.status === "Ditolak" ? (
                        <span className="text-sm text-gray-400">
                          Diproses admin
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          leave.status.toLowerCase() === "disetujui"
                            ? "bg-green-100 text-green-700"
                            : leave.status.toLowerCase() === "ditolak"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {leave.lampiran ? (
                        <a
                          href={getLampiranUrl(leave.lampiran)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm">
                          Lihat
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    {leave.status.toLocaleLowerCase() === "menunggu" && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setConfirmDeleteId(leave.id)}
                          className="
                            group
                            flex items-center justify-center
                            w-10 h-10
                            rounded-lg
                            text-red-500
                            hover:bg-red-50
                            hover:text-red-600
                            active:scale-95
                            transition-all
                            duration-200
                            cursor-pointer
                          "
                          title="Hapus izin">
                          <IoIosRemoveCircle className="text-2xl transition-transform duration-200 group-hover:scale-110" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
