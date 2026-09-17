import { IoIosNotificationsOutline } from "react-icons/io";
import { GetCurrentDateString } from "../../utils/DateUtils";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/logo_white.svg?react";
import { rekapAbsensi } from "../../utils/api/Attendence";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

export default function TopNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showModalRekap, setShowModalRekap] = useState(false);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const userInitials =
    user?.nama_lengkap
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??";

  const handleCetakRekap = async () => {
    try {
      const res = await rekapAbsensi(bulan, tahun);
      if (res.sukses) {
        navigate(`rekap?bulan=${bulan}&tahun=${tahun}`);
      }
    } catch (err) {
      const pesan = (
        err as {
          response?: { data?: { pesan?: string } };
        }
      )?.response?.data?.pesan;
      toast.error(pesan || "Gagal mengambil data");
    }
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await logout(); // AuthContext handle: hapus token + clear state + navigate
  };

  return (
    <div className="relative">
      <section className="b-white flex items-center justify-between border-b border-gray-200 px-4 sm:px-5 py-4 bg-white">
        <div className="flex flex-col cursor-default">
          <Logo className="h-12 w-fit text-blue-600" />
          <span className="text-sm text-gray-500">
            {GetCurrentDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IoIosNotificationsOutline className="text-2xl text-gray-700 cursor-pointer" />
          <button
            onClick={() => setShowMenu(true)}
            className="flex h-8 w-8 items-center text-sm justify-center rounded-full cursor-pointer
                bg-blue-100 font-semibold text-blue-600">
            {userInitials}
          </button>
        </div>
      </section>

      {showMenu && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-4 top-16 z-50 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="text-xl font-bold text-gray-900">
                {user?.nama_lengkap}
              </h2>
              <p className="mt-1 text-gray-500 text-sm">
                {user?.unit_kerja?.nama}
              </p>
            </div>

            {/* Menu */}
            <button
              className="w-full border-b border-gray-200 px-5 py-3 text-left text-md transition-colors hover:bg-gray-50"
              onClick={() => {
                setShowMenu(false);
                setShowModalRekap(true);
                // navigate("/history")
              }}>
              Rekap Kehadiran
            </button>

            <button
              className="w-full px-5 py-3 text-left text-md text-red-600 transition-colors hover:bg-red-50"
              onClick={() => {
                setShowMenu(false);
                handleLogout();
              }}>
              Keluar
            </button>
          </div>
        </>
      )}

      {showModalRekap && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center"
          onClick={() => setShowModalRekap(false)}>
          <div
            className="bg-white rounded-xl p-6 w-80 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-medium m-0">Rekap Absensi</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-500">Bulan</label>
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm">
                {[
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
                ].map((b, i) => (
                  <option key={i} value={i + 1}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-500">Tahun</label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                min={2020}
                max={2099}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModalRekap(false)}
                className="px-4 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={handleCetakRekap}
                className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">
                Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
