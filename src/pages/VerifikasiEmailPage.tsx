import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { IoArrowBack } from "react-icons/io5";
import {
  FiCheckCircle,
  FiClock,
  FiMail,
  FiRefreshCw,
  FiSend,
} from "react-icons/fi";
import TopNavbar from "../components/Client Page/TopNavbar";
import Spinner from "../components/Spinner";
import {
  getStatusVerifikasi,
  kirimVerifikasi,
  type StatusVerifikasiEmail,
} from "../utils/api/VerifikasiEmail";

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      pesan?: string;
      errors?: Record<string, string>;
      sisa_detik?: number;
    };
  };
};

const formatWaktu = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

export default function VerifikasiEmailPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusVerifikasiEmail | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [galatEmail, setGalatEmail] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let aktif = true;
    getStatusVerifikasi()
      .then((res) => {
        if (!aktif) return;
        setStatus(res);
        setEmailInput(res.email);
        setCooldown(res.sisa_detik ?? 0);
      })
      .catch(() => {
        if (aktif) toast.error("Gagal memuat status verifikasi.");
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(
      () => setCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [cooldown]);

  const handleKirim = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (mengirim || cooldown > 0) return;
    setGalatEmail(null);
    setMengirim(true);
    try {
      const res = await kirimVerifikasi(emailInput.trim());
      toast.success(res.pesan);
      setStatus((s) =>
        s
          ? {
              ...s,
              menunggu: !res.terverifikasi,
              sisa_detik: res.sisa_detik,
              terverifikasi: res.terverifikasi,
            }
          : s,
      );
      setCooldown(res.sisa_detik || 0);
      if (res.terverifikasi) {
        getStatusVerifikasi().then((baru) => {
          setStatus(baru);
          setEmailInput(baru.email);
        });
      }
    } catch (err: unknown) {
      const data = (err as ApiErrorShape).response?.data;
      const kode = (err as ApiErrorShape).response?.status;
      if (kode === 429) {
        setCooldown(data?.sisa_detik ?? 0);
        toast.error(
          data?.pesan || "Tunggu sebentar sebelum mengirim ulang.",
        );
      } else if (kode === 422) {
        setGalatEmail(data?.errors?.email ?? null);
        toast.error(data?.pesan || "Email tidak valid.");
      } else {
        toast.error(
          data?.pesan || "Gagal mengirim tautan. Coba lagi nanti.",
        );
      }
    } finally {
      setMengirim(false);
    }
  };

  const cekStatus = async () => {
    try {
      const baru = await getStatusVerifikasi();
      setStatus(baru);
      setEmailInput(baru.email);
      if (baru.terverifikasi) {
        toast.success("Email sudah terverifikasi.");
      } else if (baru.menunggu) {
        toast("Tautan belum dibuka. Cek email Anda.", { icon: "📧" });
      } else {
        toast("Status belum berubah.", { icon: "ℹ️" });
      }
    } catch {
      toast.error("Gagal memeriksa status.");
    }
  };

  const terverifikasi = status?.terverifikasi ?? false;
  const menunggu = status?.menunggu ?? false;

  return (
    <>
      <TopNavbar />
      <section className="px-6 py-2 flex flex-col gap-2">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <FiMail />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">
              Verifikasi Email
            </h1>
            <p className="text-sm text-gray-500">
              Pastikan email akun Anda aktif dan dapat menerima tautan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
            <IoArrowBack />
          </button>
        </div>

        {loading && !status ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : terverifikasi ? (
          <div className="rounded-3xl border border-green-200 bg-green-50 p-6 flex gap-4">
            <span className="shrink-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-600 text-xl">
              <FiCheckCircle />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-green-800">
                Email sudah terverifikasi
              </h2>
              <p className="mt-1 text-sm break-all text-green-700">
                {status?.email}
              </p>
              <p className="mt-1 text-xs text-green-600">
                Diverifikasi pada{" "}
                {formatWaktu(status?.email_terverifikasi_at ?? null)}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 flex gap-3">
              <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <FiClock />
              </span>
              <div className="text-sm text-amber-800">
                <p className="font-semibold">
                  Email {status?.email} belum diverifikasi
                </p>
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-700">
                  <li>Tautan verifikasi berlaku 60 menit.</li>
                  <li>
                    Tautan dibuka lewat browser dari email Anda — verifikasi
                    selesai di halaman web.
                  </li>
                  <li>
                    Login dan absensi tetap bisa dipakai, tetapi reset password
                    menunggu verifikasi.
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <form onSubmit={handleKirim} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email-verifikasi"
                    className="block text-sm font-medium text-gray-700">
                    Alamat Email
                  </label>
                  <input
                    id="email-verifikasi"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setGalatEmail(null);
                    }}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {galatEmail && (
                    <p className="text-sm text-red-600">{galatEmail}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={mengirim || cooldown > 0 || !emailInput.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
                  {mengirim ? (
                    <Spinner />
                  ) : cooldown > 0 ? (
                    <>
                      <FiClock />
                      Kirim ulang dalam {cooldown} detik
                    </>
                  ) : (
                    <>
                      <FiSend />
                      {menunggu ? "Kirim Ulang Tautan" : "Kirim Tautan Verifikasi"}
                    </>
                  )}
                </button>
              </form>

              {menunggu && !terverifikasi && (
                <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-blue-800">
                    Tautan sudah dikirim. Buka tautan dari email Anda lewat
                    browser, lalu cek statusnya di sini.
                  </p>
                  <button
                    type="button"
                    onClick={cekStatus}
                    className="shrink-0 flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 active:scale-[0.98]">
                    <FiRefreshCw />
                    Cek Status
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
