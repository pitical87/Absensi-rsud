import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  IoArrowBack,
  IoBusinessOutline,
  IoCloseOutline,
  IoPencilOutline,
  IoPersonOutline,
  IoSaveOutline,
} from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import {
  updateProfile,
  type UpdateProfileData,
} from "../utils/api/Authentication";
import { MdCancel } from "react-icons/md";

const AGAMA = ["Katolik", "Kristen", "Islam", "Hindu", "Budha", "Lainnya"];

const JK = ["Laki-Laki", "Perempuan"];

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function formatTanggal(value?: string): string {
  if (!value) return "-";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}-${m}-${y}`;
}

export default function ProfilPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<UpdateProfileData>({
    nama_lengkap: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    agama: "",
    email: "",
    no_hp: "",
    nip: "",
  });

  const set = (key: keyof UpdateProfileData) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const userInitials =
    user?.nama_lengkap
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "??";

  const bukaEdit = () => {
    setForm({
      nama_lengkap: user?.nama_lengkap ?? "",
      tempat_lahir: user?.tempat_lahir ?? "",
      tanggal_lahir: user?.tanggal_lahir ?? "",
      jenis_kelamin: user?.jenis_kelamin ?? "",
      agama: user?.agama ?? "",
      email: user?.email ?? "",
      no_hp: user?.no_hp ?? "",
      nip: user?.nip ?? "",
    });
    setEditing(true);
  };

  const batalEdit = () => {
    setEditing(false);
  };

  const simpan = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const payload: UpdateProfileData = {
        nama_lengkap: form.nama_lengkap.trim(),
        tempat_lahir: form.tempat_lahir?.trim() || null,
        tanggal_lahir: form.tanggal_lahir || null,
        jenis_kelamin: form.jenis_kelamin || null,
        agama: form.agama || null,
        email: form.email.trim(),
        no_hp: form.no_hp?.trim() || null,
        nip: form.nip?.trim() || null,
      };
      const res = await updateProfile(payload);
      setUser({
        ...user,
        nama_lengkap: payload.nama_lengkap,
        email: payload.email,
        tempat_lahir: payload.tempat_lahir ?? undefined,
        tanggal_lahir: payload.tanggal_lahir ?? undefined,
        jenis_kelamin: payload.jenis_kelamin ?? undefined,
        agama: payload.agama ?? undefined,
        no_hp: payload.no_hp ?? undefined,
        nip: payload.nip ?? undefined,
      });
      toast.success(res?.pesan || "Profil berhasil diperbarui.");
      setEditing(false);
    } catch (err) {
      const pesan = (
        err as {
          response?: { data?: { pesan?: string } };
        }
      )?.response?.data?.pesan;
      toast.error(pesan || "Fitur simpan profil belum tersedia di server.");
    } finally {
      setSubmitting(false);
    }
  };

  const nilaiPribadi: { label: string; value?: string }[] = [
    { label: "Tempat Lahir", value: user?.tempat_lahir },
    {
      label: "Tanggal Lahir",
      value: formatTanggal(user?.tanggal_lahir?.slice(0, 10)),
    },
    { label: "Jenis Kelamin", value: user?.jenis_kelamin },
    { label: "Agama", value: user?.agama },
    { label: "No. HP", value: user?.no_hp },
    { label: "Email", value: user?.email },
    { label: "NIP", value: user?.nip },
  ];

  const nilaiStruktur: { label: string; value: string }[] = [
    { label: "Unit Kerja", value: user?.unit_kerja?.nama ?? "-" },
    { label: "Sub Unit", value: user?.sub_unit?.nama ?? "-" },
    { label: "Profesi", value: user?.profesi?.nama ?? "-" },
    { label: "Jabatan", value: user?.jabatan?.nama ?? "-" },
    { label: "Posisi", value: user?.posisi || "-" },
    { label: "Status Pegawai", value: user?.status_pegawai || "-" },
  ];

  return (
    <section
      className="px-6 py-2 flex flex-col gap-4"
      style={{ paddingBottom: "80px" }}>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-8 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
          <IoArrowBack />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Profil Saya</h1>
          <p className="text-sm text-gray-500">
            Informasi akun dan data pribadi Anda.
          </p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={bukaEdit}
            className="ml-auto flex items-center gap-1 md:gap-2 rounded-xl bg-blue-600 px-2 md:px-4 py-1 md:py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            <IoPencilOutline />
            <span className="text-xs">Edit Profil</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="ml-auto flex items-center gap-1 md:gap-2 rounded-full bg-blue-600 p-3 text-lg font-semibold text-white transition hover:bg-blue-700">
            <MdCancel />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
          {userInitials}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-tight break-words">
            {user?.nama_lengkap}
          </h2>

          <div className="mt-2 flex flex-wrap gap-2">
            {user?.posisi && (
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium">
                {user.posisi}
              </span>
            )}
            {user?.status_pegawai && (
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium">
                {user.status_pegawai}
              </span>
            )}
          </div>

          <p className="mt-2 truncate text-sm text-blue-100">{user?.email}</p>
        </div>
      </div>

      {editing ? (
        <form
          onSubmit={simpan}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <IoPersonOutline />
            </div>
            <h2 className="text-base font-semibold text-gray-800">
              Edit Data Pribadi
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              className={inputCls}
              value={form.nama_lengkap}
              onChange={(e) => set("nama_lengkap")(e.target.value)}
              placeholder="Nama lengkap"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tempat Lahir
              </label>
              <input
                className={inputCls}
                value={form.tempat_lahir ?? ""}
                onChange={(e) => set("tempat_lahir")(e.target.value)}
                placeholder="Kota lahir"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tanggal Lahir
              </label>
              <input
                type="date"
                className={inputCls}
                value={form.tanggal_lahir?.slice(0, 10) ?? ""}
                onChange={(e) => set("tanggal_lahir")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Jenis Kelamin
              </label>
              <select
                className={inputCls}
                value={form.jenis_kelamin ?? ""}
                onChange={(e) => set("jenis_kelamin")(e.target.value)}>
                <option value="">Pilih</option>
                {JK.map((jk) => (
                  <option key={jk} value={jk}>
                    {jk}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Agama
              </label>
              <select
                className={inputCls}
                value={form.agama ?? ""}
                onChange={(e) => set("agama")(e.target.value)}>
                <option value="">Pilih</option>
                {AGAMA.map((agama) => (
                  <option key={agama} value={agama}>
                    {agama}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                No. HP
              </label>
              <input
                className={inputCls}
                value={form.no_hp ?? ""}
                onChange={(e) => set("no_hp")(e.target.value)}
                placeholder="08xxxx"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                NIP
              </label>
              <input
                className={inputCls}
                value={form.nip ?? ""}
                onChange={(e) => set("nip")(e.target.value)}
                placeholder="Nomor induk pegawai"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="nama@email.com"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={batalEdit}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">
              <IoCloseOutline />
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {submitting ? (
                <Spinner />
              ) : (
                <>
                  <IoSaveOutline />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <IoPersonOutline />
              </div>
              <h2 className="text-base font-semibold text-gray-800">
                Data Pribadi
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {nilaiPribadi.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {item.value || "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <IoBusinessOutline />
              </div>
              <h2 className="text-base font-semibold text-gray-800">
                Struktur & Pekerjaan
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {nilaiStruktur.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
