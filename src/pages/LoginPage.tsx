import { useEffect, useState } from "react";
import { FaHospitalUser } from "react-icons/fa";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import { forgetPassword, login } from "../utils/api/Authentication";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { FiArrowRight, FiLock, FiMail, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import Spinner from "../components/Spinner";

export default function LoginPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser, setLokasi } = useAuth();

  const [showForgetForm, setShowForgetForm] = useState(false);
  const [forgetEmail, setForgetEmail] = useState("");

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError("");
    }
  }, [error]);

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(email, pass);
      setUser(res.user);
      setLokasi(res.lokasi);
      // console.log(isDokter);
      navigate("/");
    } catch (err: any) {
      const msg =
        err.response?.data?.pesan || "Terjadi kesalahan. Silakan coba lagi."; // TAMBAH: tampilkan error
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgetPassword = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await forgetPassword(forgetEmail);
      if (res.sukses) {
        toast.success(res.pesan);
        setShowForgetForm(false);
      }
    } catch (err: any) {
      const message =
        err.response?.data?.pesan || "Terjadi Kesalahan. Silahkan Coba lagi";
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center">
      <div className="bg-blue-600 w-full h-72 flex items-center justify-center flex-col text-white">
        <div className="p-4 bg-blue-50/50 rounded-2xl">
          <FaHospitalUser className="text-6xl" />
        </div>
        <h1 className="font-bold text-2xl">SIMARO</h1>
        <span className="text-xs text-gray-300 max-w-80 text-center">
          Sistem Informasi Monitoring Absensi RSUD Online
        </span>
      </div>
      <div className="w-full p-6">
        <div className="text-start">
          <h1 className="text-2xl font-bold">SELAMAT DATANG</h1>
          <span className="text-gray-500 text-sm">
            Gunakan email dan kata sandi yang terdaftar
          </span>
        </div>
      </div>
      <form className="w-full p-6" onSubmit={handleLogin}>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            placeholder="Masukkan email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Kata Sandi
          </label>

          <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <input
              type={passwordVisible ? "text" : "password"}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full rounded-l-md px-4 py-2 outline-none"
            />

            <button
              onClick={() => setPasswordVisible(!passwordVisible)}
              type="button"
              className="px-4 text-gray-500 transition-colors hover:text-gray-700">
              {passwordVisible ? (
                <LuEye size={20} />
              ) : (
                <LuEyeClosed size={20} />
              )}
            </button>
          </div>
        </div>

        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setShowForgetForm(true);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium
               text-blue-600 hover:text-blue-700
               hover:underline transition-colors">
            <span>Lupa Password?</span>
            <FiLock className="text-base" />
          </button>
        </div>

        <div className="mt-6 flex items-center w-full justify-center">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center bg-blue-500 text-white w-full py-3 rounded-2xl hover:bg-blue-600
            font-bold text-md text-center">
            {loading ? <Spinner /> : "Masuk"}
          </button>
        </div>
        <div className="mt-4 w-full">
          <Link to="/register">
            <button
              type="button"
              className="w-full rounded-2xl border border-blue-500 py-3 font-bold text-blue-600 transition hover:bg-blue-50">
              Daftar Akun
            </button>
          </Link>
        </div>
      </form>

      <footer className="w-full flex flex-col p-4 gap-3">
        <div className="relative flex items-center justify-center">
          <span
            className="relative px-4 text-md font-serif text-slate-400
            before:absolute before:right-full before:top-1/2 before:mr-4 before:h-px before:w-12 before:-translate-y-1/2 before:bg-gray-300 sm:before:w-40
            after:absolute after:left-full after:top-1/2 after:ml-4 after:h-px after:w-12 after:-translate-y-1/2 after:bg-gray-300 sm:after:w-40">
            Info
          </span>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
          <p className="text-sm leading-relaxed">
            Akun Anda didaftarkan oleh admin instansi. Hubungi bagian IT jika
            mengalami kendala masuk.
          </p>
        </div>
      </footer>

      {showForgetForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
               bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowForgetForm(false)}>
          <div
            className="relative w-full max-w-md rounded-2xl bg-white
                 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Tombol close */}
            <button
              type="button"
              onClick={() => setShowForgetForm(false)}
              className="absolute right-4 top-4 rounded-full p-2
                   text-gray-400 hover:bg-gray-100
                   hover:text-gray-700 transition">
              <FiX size={20} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div
                className="mb-4 flex h-12 w-12 items-center
                        justify-center rounded-xl bg-blue-100
                        text-blue-600">
                <FiMail size={24} />
              </div>

              <h2 className="text-xl font-bold text-gray-800">
                Lupa Password?
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Masukkan alamat email yang terdaftar. Kami akan mengirimkan
                instruksi untuk mengatur ulang password Anda.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                handleForgetPassword(e);
              }}
              className="space-y-5">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="mb-2 block text-sm font-semibold
                       text-gray-700">
                  Alamat Email
                </label>

                <div
                  className="flex items-center gap-3 rounded-xl
                          border border-gray-300 px-4
                          transition focus-within:border-blue-500
                          focus-within:ring-2
                          focus-within:ring-blue-100">
                  <FiMail className="shrink-0 text-gray-400" />

                  <input
                    id="forgot-email"
                    type="email"
                    name="email"
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                    onChange={(e) => {
                      setForgetEmail(e.target.value);
                    }}
                    className="w-full bg-transparent py-3 text-sm
                         text-gray-800 outline-none
                         placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center
                     gap-2 rounded-xl bg-blue-600 px-4 py-3
                     text-sm font-semibold text-white
                     transition hover:bg-blue-700
                     active:scale-[0.98]">
                {loading ? (
                  <Spinner />
                ) : (
                  <>
                    Kirim Instruksi
                    <FiArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              disabled={loading}
              onClick={() => setShowForgetForm(false)}
              className="mt-4 w-full text-center text-sm
                   font-medium text-gray-500
                   hover:text-gray-800 transition">
              Kembali ke Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
