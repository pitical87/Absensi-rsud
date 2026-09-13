import { useEffect, useMemo, useState } from "react";
import { FaHospitalUser } from "react-icons/fa";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  register,
  getRegisterMaster,
  type RegisterMaster,
} from "../utils/api/Authentication";

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
const selectCls = inputCls;
const labelCls = "text-sm font-medium text-gray-700";

const TANPA_NAMA_JABATAN = ["Direktur", "Staf/Pelaksana"];
const TANPA_SEKSI_PEMBINA = [
  "Kepala Seksi/Sub Bagian",
  "Kepala Bidang/Bagian",
  "Direktur",
];

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h2 className="font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function formatTanggalLahir(tanggal: string): string {
  const digits = tanggal.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

function tanggalLahirToISO(value: string): string | null | undefined {
  if (value.trim() === "") return null;
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return undefined;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd)
    return undefined;
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [master, setMaster] = useState<RegisterMaster | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [form, setForm] = useState({
    nama_lengkap: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    agama: "",
    email: "",
    no_hp: "",
    nip: "",
    unit_kerja_id: "",
    sub_unit_id: "",
    profesi_id: "",
    jabatan_kategori: "Staf/Pelaksana",
    jabatan_id: "",
    posisi: "Staf",
    seksi_pembina_id: "",
    status_pegawai: false,
    password: "",
    password2: "",
  });

  useEffect(() => {
    getRegisterMaster()
      .then((res) => setMaster(res))
      .catch(() =>
        toast.error("Gagal memuat data pendaftaran. Muat ulang halaman."),
      )
      .finally(() => setLoadingMaster(false));
  }, []);

  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const unitTerpilih = useMemo(
    () => master?.unit.find((u) => String(u.id) === form.unit_kerja_id) ?? null,
    [master, form.unit_kerja_id],
  );

  const subOptions = unitTerpilih ? (master?.sub[unitTerpilih.id] ?? []) : [];

  const jabatanOptions = master?.jabatan[form.jabatan_kategori] ?? [];
  const tampilkanJabatan = !TANPA_NAMA_JABATAN.includes(form.jabatan_kategori);
  const tampilkanSeksiPembina = !TANPA_SEKSI_PEMBINA.includes(form.posisi);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const tanggalLahir = tanggalLahirToISO(form.tanggal_lahir);
    if (tanggalLahir === undefined) {
      toast.error(
        "Format tanggal lahir tidak valid. Gunakan format DD/MM/YYYY.",
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        nama_lengkap: form.nama_lengkap,
        tempat_lahir: form.tempat_lahir,
        tanggal_lahir: tanggalLahir,
        jenis_kelamin: form.jenis_kelamin,
        agama: form.agama,
        email: form.email,
        no_hp: form.no_hp,
        nip: form.nip,
        unit_kerja_id: form.unit_kerja_id ? Number(form.unit_kerja_id) : null,
        sub_unit_id: form.sub_unit_id ? Number(form.sub_unit_id) : null,
        profesi_id: form.profesi_id ? Number(form.profesi_id) : null,
        jabatan_kategori: form.jabatan_kategori,
        jabatan_id: form.jabatan_id ? Number(form.jabatan_id) : null,
        posisi: form.posisi,
        seksi_pembina_id: form.seksi_pembina_id
          ? Number(form.seksi_pembina_id)
          : null,
        status_pegawai: form.status_pegawai ? "PNS" : "Non-PNS",
        password: form.password,
        password2: form.password2,
      };
      const res = await register(payload);
      toast.success(res.pesan);
      navigate("/login");
    } catch (err) {
      const pesan =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "pesan" in err.response.data &&
        typeof err.response.data.pesan === "string"
          ? err.response.data.pesan
          : "Terjadi kesalahan. Silakan periksa kembali isian Anda.";
      toast.error(pesan);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center pb-10">
      <div className="bg-blue-600 w-full h-56 flex items-center justify-center flex-col text-white">
        <div className="p-4 bg-blue-50/50 rounded-2xl">
          <FaHospitalUser className="text-6xl" />
        </div>
        <h1 className="font-bold text-2xl">SIMARO</h1>
        <span className="text-xs text-gray-300 max-w-80 text-center">
          Sistem Informasi Monitoring Absensi RSUD Online
        </span>
      </div>

      <div className="w-full p-6 pb-2">
        <h1 className="text-2xl font-bold">DAFTAR AKUN</h1>
        <span className="text-gray-500 text-sm">
          Lengkapi data diri Anda untuk mendaftar sebagai pegawai
        </span>
      </div>

      <form className="w-full px-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <FormSection title="Data Pribadi">
          <Field label="Nama Lengkap" required>
            <input
              className={inputCls}
              value={form.nama_lengkap}
              onChange={(e) => set("nama_lengkap")(e.target.value)}
              placeholder="Nama lengkap sesuai KTP"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tempat Lahir">
              <input
                className={inputCls}
                value={form.tempat_lahir}
                onChange={(e) => set("tempat_lahir")(e.target.value)}
                placeholder="Kota lahir"
              />
            </Field>
            <Field
              label="Tanggal Lahir"
              hint="Format: DD/MM/YYYY. Contoh: 31/12/1990">
              <input
                type="text"
                className={inputCls}
                value={form.tanggal_lahir}
                onChange={(e) =>
                  set("tanggal_lahir")(formatTanggalLahir(e.target.value))
                }
                placeholder="DD/MM/YYYY"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Jenis Kelamin" required>
              <select
                className={selectCls}
                value={form.jenis_kelamin}
                onChange={(e) => set("jenis_kelamin")(e.target.value)}
                required>
                <option value="">Pilih</option>
                <option value="Laki-Laki">Laki-Laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </Field>
            <Field label="Agama" required>
              <select
                className={selectCls}
                value={form.agama}
                onChange={(e) => set("agama")(e.target.value)}
                required>
                <option value="">Pilih</option>
                {[
                  "Katolik",
                  "Kristen",
                  "Islam",
                  "Hindu",
                  "Budha",
                  "Lainnya",
                ].map((agama) => (
                  <option key={agama} value={agama}>
                    {agama}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Akun Login">
          <Field label="Email" required>
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="Masukkan email"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="No. HP">
              <input
                className={inputCls}
                value={form.no_hp}
                onChange={(e) => set("no_hp")(e.target.value)}
                placeholder="08xxxx"
              />
            </Field>
            <Field label="NIP">
              <input
                className={inputCls}
                value={form.nip}
                onChange={(e) => set("nip")(e.target.value)}
                placeholder="Nomor Induk Pegawai"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Field label="Kata Sandi" required hint="Minimal 6 karakter.">
              <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <input
                  type={passwordVisible ? "text" : "password"}
                  className="w-full rounded-l-md px-4 py-2 text-sm outline-none"
                  value={form.password}
                  onChange={(e) => set("password")(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="px-4 text-gray-500 transition-colors hover:text-gray-700">
                  {passwordVisible ? (
                    <LuEye size={20} />
                  ) : (
                    <LuEyeClosed size={20} />
                  )}
                </button>
              </div>
            </Field>
            <Field label="Konfirmasi Kata Sandi" required>
              <input
                type={passwordVisible ? "text" : "password"}
                className={inputCls}
                value={form.password2}
                onChange={(e) => set("password2")(e.target.value)}
                placeholder="Ulangi kata sandi"
                minLength={6}
                required
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Data Kepegawaian"
          subtitle="Informasi ini menentukan alur persetujuan izin/cuti Anda.">
          <Field label="Tempat Kerja" required>
            <select
              className={selectCls}
              value={form.unit_kerja_id}
              onChange={(e) => {
                set("unit_kerja_id")(e.target.value);
                set("sub_unit_id")("");
              }}
              required
              disabled={loadingMaster}>
              <option value="">
                {loadingMaster ? "Memuat..." : "Pilih unit kerja"}
              </option>
              {master?.unit.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama}
                </option>
              ))}
            </select>
          </Field>

          {unitTerpilih?.punya_sub && (
            <Field label="Sub Unit" required>
              <select
                className={selectCls}
                value={form.sub_unit_id}
                onChange={(e) => set("sub_unit_id")(e.target.value)}
                required>
                <option value="">Pilih sub unit</option>
                {subOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Profesi" required>
            <select
              className={selectCls}
              value={form.profesi_id}
              onChange={(e) => set("profesi_id")(e.target.value)}
              required
              disabled={loadingMaster}>
              <option value="">
                {loadingMaster ? "Memuat..." : "Pilih profesi"}
              </option>
              {master?.profesi.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-4">
            <Field label="Jabatan" required>
              <select
                className={selectCls}
                value={form.jabatan_kategori}
                onChange={(e) => {
                  set("jabatan_kategori")(e.target.value);
                  set("jabatan_id")("");
                }}
                required>
                {master?.kategori_jabatan.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>
            {tampilkanJabatan && (
              <Field label="Nama Jabatan" required>
                <select
                  className={selectCls}
                  value={form.jabatan_id}
                  onChange={(e) => set("jabatan_id")(e.target.value)}
                  required>
                  <option value="">Pilih nama jabatan</option>
                  {jabatanOptions.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <Field
            label="Posisi"
            required
            hint="Untuk Kepala Seksi/Sub Bagian, Kepala Bidang/Bagian, atau Direktur, pastikan Jabatan di atas sudah diatur sesuai.">
            <select
              className={selectCls}
              value={form.posisi}
              onChange={(e) => {
                set("posisi")(e.target.value);
                set("seksi_pembina_id")("");
              }}
              required>
              {master?.posisi.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          {tampilkanSeksiPembina && (
            <Field
              label="Seksi/Sub Bagian Pembina"
              hint="Seksi/Sub Bagian yang membina unit Anda — menentukan ke mana pengajuan izin/cuti diteruskan setelah Koordinator/Kepala Unit Anda.">
              <select
                className={selectCls}
                value={form.seksi_pembina_id}
                onChange={(e) => set("seksi_pembina_id")(e.target.value)}>
                <option value="">
                  Belum ditetapkan (admin dapat melengkapi nanti)
                </option>
                {master?.seksi_pembina.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              checked={form.status_pegawai}
              onChange={(e) => set("status_pegawai")(e.target.checked)}
            />
            Pegawai Negeri Sipil (PNS)
          </label>
          <p className="-mt-3 text-xs text-gray-400">
            Hanya pegawai berstatus PNS yang dapat mengajukan Cuti (Tahunan,
            Sakit, Melahirkan, Alasan Penting, Besar, atau di Luar Tanggungan
            Negara).
          </p>
        </FormSection>

        <button
          type="submit"
          disabled={submitting || loadingMaster}
          className="mt-2 w-full rounded-2xl bg-blue-500 py-3 font-bold text-white transition hover:bg-blue-600 disabled:opacity-60">
          {submitting ? "Mendaftar..." : "Daftar"}
        </button>

        <div className="flex items-center justify-center gap-3">
          <span className="h-px flex-1 bg-gray-300" />
          <span className="text-sm text-slate-400">sudah punya akun?</span>
          <span className="h-px flex-1 bg-gray-300" />
        </div>
        <Link to="/login">
          <button
            type="button"
            className="w-full rounded-2xl border border-blue-500 py-3 font-bold text-blue-600 transition hover:bg-blue-50">
            Masuk
          </button>
        </Link>
      </form>

      <footer className="w-full px-6 pt-2">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
          <p className="text-sm leading-relaxed">
            Akun Anda akan langsung aktif setelah pendaftaran. Hubungi bagian IT
            jika mengalami kendala.
          </p>
        </div>
      </footer>
    </div>
  );
}
