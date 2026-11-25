import { GetCurrentDateString } from "../../utils/DateUtils";
import NotificationBell from "../NotificationBell";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/logo_white.svg?react";
import { rekapSayaPdf } from "../../utils/api/Attendence";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { FaFilePdf } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import Spinner from "../Spinner";

const BULAN_ID = [
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

async function bacaPesanErrorBlob(err: unknown): Promise<string | null> {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text) as { pesan?: string; message?: string };
      return parsed.pesan ?? parsed.message ?? null;
    } catch {
      return null;
    }
  }
  if (data && typeof data === "object" && "pesan" in data) {
    const pesan = (data as { pesan?: unknown }).pesan;
    return typeof pesan === "string" ? pesan : null;
  }
  return null;
}

export default function TopNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showModalRekap, setShowModalRekap] = useState(false);
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [loadingRekap, setLoadingRekap] = useState(false);
  const barRef = useRef<HTMLElement>(null);
  const [spacerHeight, setSpacerHeight] = useState(0);

  useEffect(() => {
    if (!showModalRekap) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loadingRekap) setShowModalRekap(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModalRekap, loadingRekap]);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => {
      setSpacerHeight(mq.matches ? 0 : el.offsetHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    mq.addEventListener("change", update);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);

  const userInitials =
    user?.nama_lengkap
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??";

  const handleCetakRekap = async () => {
    setLoadingRekap(true);
    try {
      const blob = await rekapSayaPdf(bulan, tahun);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const bulanPad = String(bulan).padStart(2, "0");
      link.href = url;
      link.download = `rekap-kehadiran-${tahun}-${bulanPad}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast.success("PDF rekap kehadiran berhasil diunduh.");
      setShowModalRekap(false);
    } catch (err: unknown) {
      const pesan = await bacaPesanErrorBlob(err);
      toast.error(pesan || "Gagal membuat PDF rekap kehadiran.");
    } finally {
      setLoadingRekap(false);
    }
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await logout(); // AuthContext handle: hapus token + clear state + navigate
  };

  const handleMenuTrigger = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div className="relative">
      <section
        ref={barRef}
        className="b-white flex items-center justify-between border-b border-gray-200 px-4 sm:px-5 py-4 bg-white fixed top-0 left-0 right-0 z-50 md:relative">
        <div className="flex flex-col cursor-default">
          <Logo className="h-12 w-fit text-blue-600" />
          <span className="text-sm text-gray-500">
            {GetCurrentDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={handleMenuTrigger}
            className="flex h-8 w-8 items-center text-sm justify-center rounded-full cursor-pointer
                bg-blue-100 font-semibold text-blue-600">
            {userInitials}
          </button>
        </div>
      </section>
      <div style={{ height: spacerHeight }} aria-hidden="true" />

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
              className="w-full border-b border-gray-200 px-5 py-3 text-left text-md transition-colors hover:bg-gray-50"
              onClick={() => {
                setShowMenu(false);
                navigate("/profile");
              }}>
              Profile
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rekap-pribadi-title"
          onClick={() => {
            if (!loadingRekap) setShowModalRekap(false);
          }}>
          <div
            className="flex w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <FaFilePdf size={18} />
                </div>
                <div>
                  <h2
                    id="rekap-pribadi-title"
                    className="text-base font-semibold text-gray-900">
                    Rekap Kehadiran
                  </h2>
                  <p className="text-xs text-gray-500">
                    Daftar hadir 1 bulan ({user?.nama_lengkap})
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={loadingRekap}
                onClick={() => setShowModalRekap(false)}
                aria-label="Tutup modal"
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50">
                <FiX size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="rekap-pribadi-bulan"
                    className="text-xs font-medium text-gray-600">
                    Bulan
                  </label>
                  <select
                    id="rekap-pribadi-bulan"
                    value={bulan}
                    disabled={loadingRekap}
                    onChange={(e) => setBulan(Number(e.target.value))}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    {BULAN_ID.map((b, i) => (
                      <option key={b} value={i + 1}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="rekap-pribadi-tahun"
                    className="text-xs font-medium text-gray-600">
                    Tahun
                  </label>
                  <input
                    id="rekap-pribadi-tahun"
                    type="number"
                    value={tahun}
                    disabled={loadingRekap}
                    onChange={(e) => setTahun(Number(e.target.value))}
                    min={2020}
                    max={new Date().getFullYear() + 1}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                disabled={loadingRekap}
                onClick={() => setShowModalRekap(false)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
                Batal
              </button>
              <button
                type="button"
                disabled={loadingRekap}
                onClick={handleCetakRekap}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
                {loadingRekap ? (
                  <>
                    <Spinner />
                    <span>Membuat PDF...</span>
                  </>
                ) : (
                  <>
                    <FaFilePdf size={14} />
                    <span>Unduh PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
