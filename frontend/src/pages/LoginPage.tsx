import { useState } from "react";
import { FaHospitalUser } from "react-icons/fa";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import { login, me } from "../utils/api/Authentication";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser, setLokasi } = useAuth();

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await login(email, pass);
      setUser(res.user);
      setLokasi(res.lokasi);
      navigate("/");
    } catch (err: any) {
      const msg =
        err.response?.data?.pesan || "Terjadi kesalahan. Silakan coba lagi."; // TAMBAH: tampilkan error
      setError(msg);
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
        <h1 className="font-bold text-2xl">SIMARA</h1>
        <span className="text-xs text-gray-300 w-64 text-center">
          Sistem Absensi RSUD Merauke
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
      {error && (
        <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
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

        <div className="mt-6 flex items-center w-full flex-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white w-full py-3 rounded-2xl hover:bg-blue-600
            font-bold text-md">
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </div>
      </form>

      <footer className="w-full flex flex-col p-4 gap-3">
        <div className="relative flex items-center justify-center">
          <span
            className="relative px-4 text-md font-serif text-slate-400
            before:absolute before:right-full before:top-1/2 before:mr-4 before:h-px before:w-40 before:-translate-y-1/2 before:bg-gray-300
            after:absolute after:left-full after:top-1/2 after:ml-4 after:h-px after:w-40 after:-translate-y-1/2 after:bg-gray-300">
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
    </div>
  );
}
