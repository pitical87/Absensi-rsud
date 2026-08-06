import { useEffect, useState } from "react";
import { BiCalendar } from "react-icons/bi";
import { HiOutlineDocumentText } from "react-icons/hi";
import { IoPersonOutline, IoSunny } from "react-icons/io5";
import { LuInfo } from "react-icons/lu";
import { PiBuildingOfficeFill } from "react-icons/pi";
import { getJadwal } from "../../utils/api/Attendence";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import { FaFileCircleCheck } from "react-icons/fa6";
import { getPendingLeavesCount } from "../../utils/api/Leave";

interface ShiftInfo {
  id: number;
  kategori: string;
  jam_masuk: string;
  jam_pulang: string;
}

export default function SifSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shift, setShift] = useState<ShiftInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    getPendingLeavesCount()
      .then((res) => {
        if (res.sukses) {
          setTotalPending(res.total);
        }
      })
      .catch(() => {});
  }, []);

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
    <section className="flex flex-col w-full items-center gap-2 px-6 py-4">
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
      <div className="flex w-full gap-3">
        {/* Shift */}
        <div className="flex w-1/2 items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <IoSunny className="text-xl text-amber-500" />
          </div>

          <div className="flex flex-col">
            {loading ? (
              <span className="text-xs text-gray-400">Memuat...</span>
            ) : shift ? (
              <>
                <span
                  className={`w-fit rounded-md px-2 py-0.5 text-xs font-semibold ${
                    shift.kategori === "Pagi"
                      ? "bg-green-100 text-green-600"
                      : shift.kategori === "Sore"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-blue-100 text-blue-600"
                  }`}>
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
        <div className="flex w-1/2 flex-col justify-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <PiBuildingOfficeFill className="text-lg text-sky-600" />
            <div>
              <p className="text-[11px] text-gray-500">Unit</p>
              <p className="text-sm font-semibold">
                {user?.unit_kerja?.nama ?? user?.sub_unit?.nama ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IoPersonOutline className="text-lg text-sky-600" />
            <div>
              <p className="text-[11px] text-gray-500">Atasan</p>
              <p className="text-sm font-semibold">
                {user?.jabatan?.nama ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* izin */}
      <section className="rounded-2xl border border-gray-200 bg-white p-3 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Tidak bisa hadir ?
            </h3>
          </div>

          <button
            onClick={() => navigate("/izin")}
            className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100">
            <HiOutlineDocumentText size={20} />
            Ajukan Izin
          </button>
        </div>
      </section>
      {user?.posisi !== "Staf" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-3 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {totalPending > 0
                  ? `Ada ${totalPending} pengajuan yang menunggu!`
                  : "tidak ada pengajuan"}
              </h3>
            </div>

            <button
              onClick={() => navigate("/persetujuan")}
              className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100">
              <FaFileCircleCheck size={20} />
              Persetujuan
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
