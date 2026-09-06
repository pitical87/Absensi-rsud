import TopNavbar from "../components/Client Page/TopNavbar";
import { IoArrowBack, IoDocumentTextOutline } from "react-icons/io5";
import { HiOutlineClock } from "react-icons/hi";
import { useEffect, useState } from "react";
import { FaRegCheckCircle, FaRegTrashAlt, FaRegStar, FaStar } from "react-icons/fa";
import { RiFileHistoryLine } from "react-icons/ri";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import {
  ajukanLembur,
  batalLembur,
  getLemburList,
} from "../utils/api/Lembur";
import type { PengajuanLembur } from "../types/LemburType";

type FormValues = {
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  keterangan: string;
};

type Konfig = {
  batas_jam: number;
  maks_jam: number;
  hari_ke_depan: number;
};

function toMenit(jam: string): number {
  const [h, m] = jam.split(":").map(Number);
  return h * 60 + m;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const tgl = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${tgl}`;
}

function durasiTeks(menit: number): string {
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam === 0) return `${sisa} menit`;
  if (sisa === 0) return `${jam} jam`;
  return `${jam} jam ${sisa} menit`;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Disetujui"
      ? "bg-green-100 text-green-700"
      : status === "Ditolak"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function Bintang({ nilai }: { nilai: number | null }) {
  if (nilai === null) return null;
  const bulat = Math.round(nilai);
  return (
    <span className="flex gap-0.5 text-amber-400 text-xs">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= bulat ? <FaStar key={i} /> : <FaRegStar key={i} />,
      )}
    </span>
  );
}

export default function LemburPage() {
  const navigate = useNavigate();
  const [konfig, setKonfig] = useState<Konfig | null>(null);
  const [riwayat, setRiwayat] = useState<PengajuanLembur[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      tanggal: ymd(new Date()),
      jam_mulai: "",
      jam_selesai: "",
      keterangan: "",
    },
  });

  const jamMulai = watch("jam_mulai");
  const jamSelesai = watch("jam_selesai");

  const refetch = () => {
    getLemburList().then((res) => {
      if (res.sukses) {
        setKonfig({
          batas_jam: res.batas_jam,
          maks_jam: res.maks_jam,
          hari_ke_depan: res.hari_ke_depan,
        });
        setRiwayat(res.riwayat);
      }
    });
  };

  useEffect(() => {
    refetch();
  }, []);

  const minTanggal = ymd(new Date());
  const maxTanggal =
    konfig !== null
      ? ymd(new Date(Date.now() + konfig.hari_ke_depan * 86400000))
      : undefined;

  const durasiPreview =
    jamMulai && jamSelesai && toMenit(jamSelesai) > toMenit(jamMulai)
      ? toMenit(jamSelesai) - toMenit(jamMulai)
      : null;

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await ajukanLembur(data);
      if (res.sukses) {
        toast.success(res.pesan);
        reset();
        refetch();
      } else {
        toast.error(res.pesan);
      }
    } catch (err: unknown) {
      const pesan = (err as {
        response?: { data?: { pesan?: string } };
      })?.response?.data?.pesan;
      toast.error(pesan || "Gagal mengirim pengajuan. Silakan coba lagi.");
    }
  };

  const onDelete = async (id: number) => {
    try {
      const res = await batalLembur(id);
      if (res.sukses) {
        toast.success(res.pesan);
        refetch();
      } else {
        toast.error(res.pesan);
      }
    } catch (err: unknown) {
      const pesan = (err as {
        response?: { data?: { pesan?: string } };
      })?.response?.data?.pesan;
      toast.error(pesan || "Gagal membatalkan pengajuan.");
    }
  };

  return (
    <>
      <TopNavbar />
      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Batalkan Pengajuan Lembur?"
        message="Pengajuan ini akan dibatalkan dan tidak dapat dikembalikan."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        onConfirm={() => {
          if (confirmDeleteId) onDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <section className="px-6 py-2 flex flex-col gap-2">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <IoDocumentTextOutline />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">Lembur</h1>
            <p className="text-sm text-gray-500">
              Ajukan lembur & lakukan absen lembur.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
            <IoArrowBack />
          </button>
        </div>

        {/* Konfigurasi */}
        {konfig && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 px-4 py-3 flex flex-col gap-1 text-sm text-blue-700">
            <p className="flex items-center gap-2">
              <HiOutlineClock className="shrink-0" />
              Pengajuan paling lambat <strong>{konfig.batas_jam} jam</strong>{" "}
              sebelum jam mulai.
            </p>
            <p className="flex items-center gap-2">
              <HiOutlineClock className="shrink-0" />
              Durasi maksimal <strong>{konfig.maks_jam} jam/hari</strong>, untuk
              maksimal <strong>{konfig.hari_ke_depan} hari</strong> ke depan.
            </p>
          </div>
        )}

        {/* Form Pengajuan */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-800">
                Ajukan Lembur
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Lembur memerlukan persetujuan atasan langsung sebelum dapat
              diabsensi.
            </p>
          </div>

          {/* Tanggal */}
          <div className="space-y-2">
            <label
              htmlFor="tanggal"
              className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
              Tanggal
            </label>
            <input
              id="tanggal"
              type="date"
              min={minTanggal}
              max={maxTanggal}
              {...register("tanggal", {
                required: "Tanggal wajib diisi",
              })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {errors.tanggal && (
              <p className="text-red-500 text-xs">{errors.tanggal.message}</p>
            )}
          </div>

          {/* Jam Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="jam_mulai"
                className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                Jam Mulai
              </label>
              <input
                id="jam_mulai"
                type="time"
                {...register("jam_mulai", {
                  required: "Jam mulai wajib diisi",
                })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {errors.jam_mulai && (
                <p className="text-red-500 text-xs">
                  {errors.jam_mulai.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="jam_selesai"
                className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                Jam Selesai
              </label>
              <input
                id="jam_selesai"
                type="time"
                min={jamMulai || undefined}
                {...register("jam_selesai", {
                  required: "Jam selesai wajib diisi",
                  validate: (v) => {
                    if (!jamMulai) return true;
                    const selisih = toMenit(v) - toMenit(jamMulai);
                    if (selisih <= 0)
                      return "Jam selesai harus setelah jam mulai";
                    if (konfig && selisih > konfig.maks_jam * 60)
                      return `Durasi melebihi maksimal ${konfig.maks_jam} jam/hari`;
                    return true;
                  },
                })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              {errors.jam_selesai && (
                <p className="text-red-500 text-xs">
                  {errors.jam_selesai.message}
                </p>
              )}
            </div>
          </div>

          {durasiPreview !== null && (
            <p className="text-sm text-gray-500">
              Durasi lembur:{" "}
              <span className="font-semibold text-blue-600">
                {durasiTeks(durasiPreview)}
              </span>
            </p>
          )}

          {/* Keterangan */}
          <div className="space-y-2">
            <label
              htmlFor="keterangan"
              className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
              Keterangan / Keperluan
            </label>
            <textarea
              id="keterangan"
              rows={4}
              placeholder="Masukkan alasan atau keperluan lembur..."
              {...register("keterangan", {
                required: "Keterangan wajib diisi",
                maxLength: {
                  value: 1000,
                  message: "Maksimal 1000 karakter",
                },
              })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 outline-none transition resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {errors.keterangan && (
              <p className="text-red-500 text-xs">
                {errors.keterangan.message}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
              <FaRegCheckCircle className="text-lg" />
              <span>
                {isSubmitting ? "Mengirim..." : "Kirim Pengajuan Lembur"}
              </span>
            </button>
          </div>
        </form>

        {/* Riwayat */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
              <RiFileHistoryLine />
            </div>
            Riwayat Pengajuan Lembur
          </h1>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Jam
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Durasi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Keterangan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Catatan Keputusan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Absen
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {riwayat.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-sm text-gray-400">
                      Belum ada pengajuan lembur.
                    </td>
                  </tr>
                ) : (
                  riwayat.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">
                          {r.tanggal}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {r.hari}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {r.jam_mulai} - {r.jam_selesai}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.durasi_jam} jam
                      </td>
                      <td className="px-4 py-3">{r.keterangan}</td>
                      <td className="px-4 py-3 text-center">
                        {r.catatan_keputusan ? (
                          <span className="text-sm text-gray-600">
                            {r.catatan_keputusan}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.absen ? (
                          <div className="flex flex-col gap-1 text-xs text-gray-600">
                            {r.absen.waktu_masuk && (
                              <span>
                                Masuk {r.absen.waktu_masuk?.slice(11, 16)}
                              </span>
                            )}
                            {r.absen.waktu_pulang && (
                              <span>
                                Pulang {r.absen.waktu_pulang?.slice(11, 16)}
                              </span>
                            )}
                            {r.absen.bintang !== null && (
                              <Bintang nilai={r.absen.bintang} />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.status === "Menunggu" && (
                          <button
                            onClick={() => setConfirmDeleteId(r.id)}
                            className="group flex items-center justify-center w-10 h-10 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all duration-200 cursor-pointer"
                            title="Batalkan pengajuan">
                            <FaRegTrashAlt className="text-xl transition-transform duration-200 group-hover:scale-110" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}