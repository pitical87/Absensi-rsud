import { useEffect, useState } from "react";
import {
  BiCalendar,
  BiCalendarEdit,
  BiCalendarWeek,
  BiServer,
  BiTimeFive,
} from "react-icons/bi";
import { HiOutlineDocumentReport, HiOutlineDocumentText } from "react-icons/hi";
import { IoPersonOutline, IoSunny } from "react-icons/io5";
import { LuInfo } from "react-icons/lu";
import { PiBuildingOfficeFill } from "react-icons/pi";
import { getJadwal } from "../../utils/api/Attendence";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import { FaFileCircleCheck } from "react-icons/fa6";
import { getPendingLeavesCount } from "../../utils/api/Leave";
import { getLemburMenungguTotal } from "../../utils/api/Lembur";
import { getPerubahanJadwalMenungguTotal } from "../../utils/api/PerubahanJadwal";
import Skeleton from "../Skeleton";
import RekapBulananModal from "./RekapBulananModal";
import MappingSimrsModal from "./MappingSimrsModal";

interface ShiftInfo {
  id: number;
  kategori: string;
  jam_masuk: string;
  jam_pulang: string;
}

export default function SifSection() {
  const navigate = useNavigate();
  const { user, can, bawahan, atasan, lemburAktif } = useAuth();
  const [shift, setShift] = useState<ShiftInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalLemburPending, setTotalLemburPending] = useState(0);
  const [totalJadwalPending, setTotalJadwalPending] = useState(0);
  const [loadingIzin, setLoadingIzin] = useState(true);
  const [loadingLembur, setLoadingLembur] = useState(true);
  const [loadingJadwal, setLoadingJadwal] = useState(true);
  const [showRekapBulanan, setShowRekapBulanan] = useState(false);
  const [showMappingSimrs, setShowMappingSimrs] = useState(false);

  const daftarBawahan = bawahan ?? [];
  const punyaBawahanLain = daftarBawahan.some((b) => b.id !== user?.id);
  const tampilPersetujuan =
    can("jadwal.kelola") ||
    can("approve.izin") ||
    can("approve.lembur") ||
    can("approve.jadwal") ||
    punyaBawahanLain;

  useEffect(() => {
    if (!can("approve.izin")) return;
    getPendingLeavesCount()
      .then((res) => {
        if (res.sukses) {
          setTotalPending(res.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingIzin(false));
  }, [can]);

  useEffect(() => {
    if (!can("approve.lembur")) return;
    getLemburMenungguTotal()
      .then((res) => {
        if (res.sukses) {
          setTotalLemburPending(res.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLembur(false));
  }, [can]);

  useEffect(() => {
    if (!can("approve.jadwal")) return;
    getPerubahanJadwalMenungguTotal()
      .then((res) => {
        if (res.sukses) {
          setTotalJadwalPending(res.total);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingJadwal(false));
  }, [can]);

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const res = await getJadwal();
        if (res.sukses) {
          setShift(res.shift);
        }
      } catch {
        // fallback ke user.shift dari auth context
        if (user?.shift) {
          setShift({
            id: user.shift.id,
            kategori: user.shift.kategori,
            jam_masuk: user.shift.jam_masuk,
            jam_pulang: user.shift.jam_pulang,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJadwal();
  }, [user]);

  const getDurasi = () => {
    if (!shift) return "";
    const [masukH, masukM] = shift.jam_masuk.split(":").map(Number);
    const [pulangH, pulangM] = shift.jam_pulang.split(":").map(Number);
    let menit = pulangH * 60 + pulangM - (masukH * 60 + masukM);
    if (menit < 0) menit += 24 * 60;
    const jam = Math.floor(menit / 60);
    const sisa = menit % 60;
    return sisa > 0 ? `${jam} jam ${sisa} menit` : `${jam} jam`;
  };

  return (
    <section className="flex flex-col w-full items-center gap-2 px-4 sm:px-6 py-4">
      <h1 className="flex gap-3 items-center w-text-lg w-full font-bold">
        <BiCalendar /> Shift hari ini
      </h1>
      <div
        className="bg-white border border-gray-300 flex font-semibold
                  items-center gap-2 w-full rounded-xl p-3 text-blue-500 text-sm">
        <LuInfo className="text-md font-semibold" />
        <span className="text-xs">
          Jadwal diambil dari sistem sesuai penugasan anda
        </span>
      </div>
      <div className="flex w-full flex-col gap-3 min-[400px]:flex-row">
        {/* Shift */}
        <div className="flex w-full min-[400px]:w-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <IoSunny className="text-xl text-amber-500" />
          </div>

          <div className="flex flex-col">
            {loading ? (
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : shift ? (
              <>
                <span
                  className={`w-fit rounded-md px-2 py-0.5 text-xs font-semibold ${shift.kategori === "Pagi" ? "bg-green-100 text-green-600" : shift.kategori === "Sore" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"}`}>
                  Shift {shift.kategori}
                </span>
                <span className="mt-1 text-sm font-semibold text-gray-800">
                  {shift.jam_masuk} - {shift.jam_pulang}
                </span>
                <span className="text-xs text-gray-500">
                  Durasi {getDurasi()}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Belum ada shift</span>
            )}
          </div>
        </div>

        {/* Unit */}
        <div className="flex w-full min-[400px]:w-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          <div className="rounded-lg bg-sky-100 p-2 shrink-0">
            <PiBuildingOfficeFill className="text-xl text-sky-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Unit</p>
            <p className="text-xs sm:text-sm font-semibold leading-snug text-gray-800 break-words">
              {user?.unit_kerja?.nama ?? user?.sub_unit?.nama ?? "—"}
            </p>
            {user?.unit_kerja?.nama && user?.sub_unit?.nama && (
              <p className="text-[11px] text-gray-500 truncate">
                {user.sub_unit.nama}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Atasan Langsung — lebar penuh agar rapi meski lebih dari 1 */}
      <div className="flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
        <div className="rounded-lg bg-sky-50 p-1.5 shrink-0 mt-0.5">
          <IoPersonOutline className="text-base text-sky-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-gray-500">Atasan Langsung</p>
          {atasan && atasan.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {atasan.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-800">
                  {a.nama}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-semibold text-gray-800">—</p>
          )}
        </div>
      </div>
      {/* Pengajuan & Mapping */}
      <section className="w-full rounded-2xl border border-gray-200 bg-white p-3">
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-gray-900">
            Pengajuan & Mapping
          </h3>

          <div
            className={`grid gap-2 ${
              lemburAktif ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
            }`}>
            <button
              onClick={() => navigate("/izin")}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-2 py-3 text-sm font-medium text-orange-600 transition hover:bg-orange-100">
              <HiOutlineDocumentText size={20} />
              <span>Izin/Cuti</span>
            </button>

            {lemburAktif && (
              <button
                type="button"
                onClick={() => navigate("/lembur")}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-2 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-100">
                <BiTimeFive size={20} />
                <span>Lembur</span>
              </button>
            )}

            <button
              onClick={() => navigate("/ubah-jadwal")}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-3 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100">
              <BiCalendarEdit size={20} />
              <span>Perubahan Shift</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMappingSimrs(true)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-2 py-3 text-sm font-medium text-teal-600 transition hover:bg-teal-100">
              <BiServer size={20} />
              <span>Mapping SIMRS</span>
            </button>
          </div>
        </div>
      </section>
      {/* Persetujuan & pengelolaan*/}
      <section
        className={`w-full rounded-2xl border border-gray-200 bg-white p-3 ${
          !tampilPersetujuan ? "hidden" : ""
        }`}>
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-gray-900">
            Persetujuan & Pengelolaan
          </h3>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {can("jadwal.kelola") && (
              <button
                onClick={() => navigate("/kelola-jadwal")}
                className="relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-2 py-3 text-sm font-medium text-sky-600 transition hover:bg-sky-100">
                <BiCalendarWeek size={20} />
                <span>Kelola Jadwal</span>
                {!loadingIzin && totalPending > 0 && (
                  <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {totalPending}
                  </span>
                )}
              </button>
            )}

            {can("approve.izin") && (
              <button
                onClick={() => navigate("/persetujuan")}
                className="relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-2 py-3 text-sm font-medium text-orange-600 transition hover:bg-orange-100">
                <FaFileCircleCheck size={20} />
                <span>Izin</span>
                {!loadingIzin && totalPending > 0 && (
                  <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {totalPending}
                  </span>
                )}
              </button>
            )}

            {lemburAktif && can("approve.lembur") && (
              <button
                type="button"
                onClick={() => navigate("/persetujuan-lembur")}
                className="relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-2 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-100">
                <FaFileCircleCheck size={20} />
                <span>Lembur</span>
                {!loadingLembur && totalLemburPending > 0 && (
                  <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {totalLemburPending}
                  </span>
                )}
              </button>
            )}

            {can("approve.jadwal") && (
              <button
                onClick={() => navigate("/persetujuan-jadwal")}
                className="relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-3 text-sm font-medium text-indigo-600 transition hover:bg-indigo-100">
                <FaFileCircleCheck size={20} />
                <span>Perubahan Jadwal</span>
                {!loadingJadwal && totalJadwalPending > 0 && (
                  <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {totalJadwalPending}
                  </span>
                )}
              </button>
            )}

            {daftarBawahan.length > 0 && (
              <button
                type="button"
                onClick={() => setShowRekapBulanan(true)}
                className="relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-3 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100">
                <HiOutlineDocumentReport size={20} />
                <span>Rekap Bulanan</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <RekapBulananModal
        key={showRekapBulanan ? "open" : "closed"}
        isOpen={showRekapBulanan}
        bawahan={daftarBawahan}
        onClose={() => setShowRekapBulanan(false)}
      />

      <MappingSimrsModal
        key={showMappingSimrs ? "mapping-open" : "mapping-closed"}
        isOpen={showMappingSimrs}
        onClose={() => setShowMappingSimrs(false)}
      />
    </section>
  );
}
