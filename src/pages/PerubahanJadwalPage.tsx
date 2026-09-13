import TopNavbar from "../components/Client Page/TopNavbar";
import { IoArrowBack } from "react-icons/io5";
import { BiCalendarEdit } from "react-icons/bi";
import { HiOutlineClock } from "react-icons/hi";
import { useEffect, useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaRegCheckCircle,
  FaRegTrashAlt,
} from "react-icons/fa";
import { RiFileHistoryLine } from "react-icons/ri";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import {
  ajukanPerubahanJadwal,
  batalPerubahanJadwal,
  getPerubahanJadwal,
  getPerubahanJadwalShifts,
} from "../utils/api/PerubahanJadwal";
import type {
  JadwalMendatang,
  RiwayatPengajuanJadwal,
  ShiftInfo,
} from "../types/PerubahanJadwalType";

type FormValues = {
  shift_baru_id: string;
  alasan: string;
};

const BULAN = [
  "",
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

function tglId(tgl: string): string {
  const [y, m, d] = tgl.split("-").map(Number);
  return `${d} ${BULAN[m] ?? m} ${y}`;
}

function shiftLabel(s: ShiftInfo): string {
  return s.label ?? `${s.kategori} (${s.jam_masuk} - ${s.jam_pulang})`;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Disetujui"
      ? "bg-green-100 text-green-700"
      : status === "Ditolak"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function PerubahanJadwalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [batasJam, setBatasJam] = useState<number | null>(null);
  const [jadwal, setJadwal] = useState<JadwalMendatang[]>([]);
  const [daftarShift, setDaftarShift] = useState<ShiftInfo[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatPengajuanJadwal[]>([]);
  const [buatUntuk, setBuatUntuk] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      shift_baru_id: "",
      alasan: "",
    },
  });

  const refetch = () => {
    Promise.all([getPerubahanJadwal(), getPerubahanJadwalShifts()])
      .then(([daftarRes, shiftRes]) => {
        if (daftarRes.sukses) {
          setBatasJam(daftarRes.batas_jam);
          setJadwal(daftarRes.jadwal ?? []);
          setRiwayat(daftarRes.riwayat ?? []);
        }
        if (shiftRes.sukses) {
          setDaftarShift(shiftRes.data ?? []);
        }
      })
      .catch(() => {
        toast.error("Gagal memuat data jadwal.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
  }, []);

  const bukaForm = (tanggal: string) => {
    setBuatUntuk(tanggal);
    reset({ shift_baru_id: "", alasan: "" });
  };

  const onSubmit = async (data: FormValues) => {
    if (!buatUntuk) return;
    try {
      const res = await ajukanPerubahanJadwal({
        tanggal: buatUntuk,
        shift_baru_id: Number(data.shift_baru_id),
        alasan: data.alasan,
      });
      if (res.sukses) {
        toast.success(res.pesan);
        setBuatUntuk(null);
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

  const onBatal = async (id: number) => {
    try {
      const res = await batalPerubahanJadwal(id);
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
        title="Batalkan Pengajuan Perubahan Jadwal?"
        message="Pengajuan ini akan dibatalkan dan tidak dapat dikembalikan."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Tidak"
        onConfirm={() => {
          if (confirmDeleteId) onBatal(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <section className="px-6 py-2 flex flex-col gap-2">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <BiCalendarEdit />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">
              Perubahan Jadwal Shift
            </h1>
            <p className="text-sm text-gray-500">
              Ajukan perubahan atau tukar shift.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
            <IoArrowBack />
          </button>
        </div>

        {/* Info */}
        {batasJam !== null && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 px-4 py-3 flex items-center gap-2 text-sm text-blue-700">
            <HiOutlineClock className="shrink-0" />
            <p>
              Perubahan jadwal paling lambat{" "}
              <strong>{batasJam} jam</strong> sebelum shift dimulai, untuk 30
              hari ke depan.
            </p>
          </div>
        )}

        {/* Jadwal Mendatang */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
              <BiCalendarEdit />
            </div>
            Jadwal Mendatang
          </h1>
          <p className="text-sm text-gray-500">
            Pilih tanggal untuk mengajukan perubahan shift.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : jadwal.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              Tidak ada jadwal dalam 30 hari ke depan.
            </p>
          ) : (
            <div className="space-y-3">
              {jadwal.map((row) => (
                <div
                  key={row.tanggal}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">
                        {row.hari}, {tglId(row.tanggal)}
                      </p>
                      {row.shift ? (
                        <p className="mt-1 text-sm text-gray-600">
                          <span
                            className={`mr-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                              row.shift.kategori === "Pagi"
                                ? "bg-green-100 text-green-600"
                                : row.shift.kategori === "Sore"
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-blue-100 text-blue-600"
                            }`}>
                            {row.shift.kategori}
                          </span>
                          {row.shift.jam_masuk} - {row.shift.jam_pulang}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          Libur / tanpa jadwal shift
                        </p>
                      )}
                    </div>

                    {row.pengajuan_aktif ? (
                      <StatusBadge status={row.pengajuan_aktif.status} />
                    ) : row.bisa_ajukan ? (
                      row.shift && (
                        <button
                          type="button"
                          onClick={() =>
                            buatUntuk === row.tanggal
                              ? setBuatUntuk(null)
                              : bukaForm(row.tanggal)
                          }
                          className="flex shrink-0 items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                          {buatUntuk === row.tanggal ? (
                            <FaChevronUp className="text-xs" />
                          ) : (
                            <FaChevronDown className="text-xs" />
                          )}
                          Ajukan
                        </button>
                      )
                    ) : (
                      <p className="max-w-[160px] shrink-0 text-right text-xs text-gray-400">
                        {row.alasan_blok || "Tidak dapat diajukan"}
                      </p>
                    )}
                  </div>

                  {buatUntuk === row.tanggal && (
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="mt-4 space-y-4 rounded-xl border border-blue-200 bg-white p-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="shift_baru_id"
                          className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                          Shift Pengganti
                        </label>
                        <select
                          id="shift_baru_id"
                          {...register("shift_baru_id", {
                            required: "Shift pengganti wajib dipilih",
                          })}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                          <option value="">Pilih shift pengganti...</option>
                          {daftarShift
                            .filter((s) => s.id !== row.shift?.id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {shiftLabel(s)}
                              </option>
                            ))}
                        </select>
                        {errors.shift_baru_id && (
                          <p className="text-red-500 text-xs">
                            {errors.shift_baru_id.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="alasan"
                          className="block text-sm font-medium text-gray-700 after:content-['*'] after:text-red-500 after:ml-1">
                          Alasan
                        </label>
                        <textarea
                          id="alasan"
                          rows={3}
                          placeholder="Masukkan alasan perubahan jadwal..."
                          {...register("alasan", {
                            required: "Alasan wajib diisi",
                            maxLength: {
                              value: 1000,
                              message: "Maksimal 1000 karakter",
                            },
                          })}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 placeholder:text-gray-400 outline-none transition resize-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                        {errors.alasan && (
                          <p className="text-red-500 text-xs">
                            {errors.alasan.message}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
                        <FaRegCheckCircle className="text-lg" />
                        <span>
                          {isSubmitting
                            ? "Mengirim..."
                            : "Kirim Pengajuan"}
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Riwayat */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
              <RiFileHistoryLine />
            </div>
            Riwayat Pengajuan
          </h1>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Shift
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                    Alasan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                    Catatan Keputusan
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
                      colSpan={6}
                      className="px-4 py-6 text-center text-sm text-gray-400">
                      Belum ada pengajuan perubahan jadwal.
                    </td>
                  </tr>
                ) : (
                  riwayat.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">
                          {tglId(r.tanggal)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="text-gray-600">
                          {r.shift_lama || "—"}
                        </span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="font-medium text-gray-800">
                          {r.shift_baru || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.alasan}</td>
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