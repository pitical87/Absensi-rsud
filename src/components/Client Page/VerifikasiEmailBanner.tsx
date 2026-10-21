import { useState } from "react";
import { useNavigate } from "react-router";
import { FaXmark } from "react-icons/fa6";
import { FiMail } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export default function VerifikasiEmailBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutup, setTutup] = useState(() => {
    if (!user?.email) return false;
    return (
      sessionStorage.getItem(`maro_verifikasi_email_${user.email}`) === "1"
    );
  });

  if (!user?.email_verified_at && user?.email && !tutup) {
    const tutupBanner = () => {
      sessionStorage.setItem(`maro_verifikasi_email_${user.email}`, "1");
      setTutup(true);
    };

    return (
      <section className="px-4 sm:px-6 pt-2 w-full">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 flex gap-3">
          <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <FiMail />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-800">
              Email belum diverifikasi
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {user.email} belum diverifikasi. Anda tetap dapat masuk dan
              absensi, namun reset password tidak bisa digunakan.
            </p>
            <button
              type="button"
              onClick={() => navigate("/verifikasi-email")}
              className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 active:scale-[0.98]">
              Verifikasi Sekarang
            </button>
          </div>
          <button
            type="button"
            onClick={tutupBanner}
            aria-label="Tutup"
            className="self-start text-gray-400 transition hover:text-gray-600">
            <FaXmark />
          </button>
        </div>
      </section>
    );
  }

  return null;
}
