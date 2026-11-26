import { useEffect, useMemo, useState } from "react";
import { BiCheckCircle, BiReset, BiUserCheck } from "react-icons/bi";
import { HiOutlineInformationCircle } from "react-icons/hi";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import LogoWarna from "../assets/logo_white.svg?react";
import ConfirmModal from "../components/ConfirmModal";
import Skeleton from "../components/Skeleton";
import Spinner from "../components/Spinner";
import {
  register,
  getRegisterMaster,
  STATUS_PEGAWAI_OPTIONS,
  type RegisterMaster,
} from "../utils/api/Authentication";

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400";
const selectCls = inputCls;
const labelCls = "text-xs sm:text-sm font-medium text-gray-700";

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
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-3.5">{children}</div>
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
      {hint && <p className="text-[11px] text-gray-400 leading-snug">{hint}</p>}
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

const DRAFT_STORAGE_KEY = "maro_register_draft_v1";

const INITIAL_FORM = {
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
  status_pegawai: "Non-PNS",
  password: "",
  password2: "",
};

type RegisterFormState = typeof INITIAL_FORM;

const PERSISTED_KEYS: (keyof RegisterFormState)[] = [
  "nama_lengkap",
  "tempat_lahir",
  "tanggal_lahir",
  "jenis_kelamin",
  "agama",
  "email",
  "no_hp",
  "nip",
  "unit_kerja_id",
  "sub_unit_id",
  "profesi_id",
  "status_pegawai",
];

function loadDraft(): RegisterFormState {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return INITIAL_FORM;
    const parsed = JSON.parse(raw) as Partial<Record<keyof RegisterFormState, unknown>>;
    if (!parsed || typeof parsed !== "object") return INITIAL_FORM;
    const next: RegisterFormState = { ...INITIAL_FORM };
    for (const key of PERSISTED_KEYS) {
      const val = parsed[key];
      if (typeof val === "string") {
        next[key] = val;
      }
    }
    return next;
  } catch {
    return INITIAL_FORM;
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Abaikan bila localStorage dibatasi browser
  }
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [master, setMaster] = useState<RegisterMaster | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [form, setForm] = useState<RegisterFormState>(loadDraft);

  const hasFilledInput = useMemo(
    () =>
      (Object.keys(INITIAL_FORM) as (keyof RegisterFormState)[]).some(
        (k) => form[k] !== INITIAL_FORM[k],
      ),
    [form],
  );

  // Simpan draft ke localStorage secara otomatis (tanpa kata sandi) agar tidak hilang saat refresh
  useEffect(() => {
    const hasPersisted = PERSISTED_KEYS.some(
      (k) => form[k] !== INITIAL_FORM[k],
    );
    try {
      if (!hasPersisted) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      const draft: Partial<RegisterFormState> = {};
      for (const k of PERSISTED_KEYS) {
        draft[k] = form[k];
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Abaikan bila localStorage tidak tersedia / penuh
    }
  }, [form]);

  const handleReset = () => {
    clearDraft();
    setForm(INITIAL_FORM);
    setConfirmReset(false);
    toast.success("Isian formulir telah direset.");
  };

  useEffect(() => {
    getRegisterMaster()
      .then((res) => setMaster(res))
      .catch(() =>
        toast.error("Gagal memuat data pendaftaran. Muat ulang halaman."),
      )
      .finally(() => setLoadingMaster(false));
  }, []);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const unitTerpilih = useMemo(
    () => master?.unit.find((u) => String(u.id) === form.unit_kerja_id) ?? null,
    [master, form.unit_kerja_id],
  );

  const subOptions = useMemo(
    () => (unitTerpilih ? (master?.sub[unitTerpilih.id] ?? []) : []),
    [master, unitTerpilih],
  );

  const subTerpilih = useMemo(
    () => subOptions.find((s) => String(s.id) === form.sub_unit_id) ?? null,
    [subOptions, form.sub_unit_id],
  );

  // Resolusi atasan langsung otomatis: prioritas sub unit -> unit kerja (sama dengan form admin)
  const atasanOtomatis = useMemo(() => {
    if (subTerpilih?.atasan_id && subTerpilih.atasan_nama) {
      return {
        id: subTerpilih.atasan_id,
        nama: subTerpilih.atasan_nama,
        sumber: "sub unit" as const,
      };
    }
    if (
      unitTerpilih &&
      (!unitTerpilih.punya_sub || subTerpilih) &&
      unitTerpilih.atasan_id &&
      unitTerpilih.atasan_nama
    ) {
      return {
        id: unitTerpilih.atasan_id,
        nama: unitTerpilih.atasan_nama,
        sumber: "tempat kerja" as const,
      };
    }
    return null;
  }, [subTerpilih, unitTerpilih]);

  const tempatKerjaLengkap = Boolean(
    unitTerpilih && (!unitTerpilih.punya_sub || subTerpilih),
  );

  const isPns = form.status_pegawai === "PNS";
  const passwordMismatch =
    form.password2.length > 0 && form.password !== form.password2;
  const passwordMatch =
    form.password2.length > 0 && form.password === form.password2;

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const tanggalLahir = tanggalLahirToISO(form.tanggal_lahir);
    if (tanggalLahir === undefined) {
      toast.error(
        "Format tanggal lahir tidak valid. Gunakan format DD/MM/YYYY.",
      );
      return;
    }
    if (isPns && !form.nip.trim()) {
      toast.error("NIP wajib diisi untuk pegawai berstatus PNS.");
      return;
    }
    if (form.password !== form.password2) {
      toast.error("Konfirmasi kata sandi tidak sama.");
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
        nip: isPns ? form.nip.trim() : "",
        unit_kerja_id: form.unit_kerja_id ? Number(form.unit_kerja_id) : null,
        sub_unit_id: form.sub_unit_id ? Number(form.sub_unit_id) : null,
        profesi_id: form.profesi_id ? Number(form.profesi_id) : null,
        jabatan_kategori: "Staf/Pelaksana",
        jabatan_id: null,
        posisi: "Staf",
        seksi_pembina_id: null,
        status_pegawai: form.status_pegawai,
        password: form.password,
        password2: form.password2,
      };
      const res = await register(payload);
      clearDraft();
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
    <div className="min-h-screen bg-gray-50/70 pb-10">
      {/* Header selaras dengan LoginPage */}
      <div className="bg-blue-600 w-full py-10 px-6 flex items-center justify-center flex-col text-white">
        <LogoWarna className="h-24 w-auto" />
        <span className="mt-2 text-xs sm:text-sm font-semibold text-blue-100 max-w-80 text-center">
          Sistem Monitoring Absensi RSUD Online
        </span>
      </div>

      <div className="px-4 sm:px-6 pt-5 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            Daftar Akun Pegawai
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-gray-500">
            Lengkapi data diri & penempatan kerja Anda untuk mendaftar.
          </p>
          {hasFilledInput && (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <BiCheckCircle className="shrink-0 text-xs" />
              Data tersimpan otomatis di perangkat ini
            </p>
          )}
        </div>
        {hasFilledInput && (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 active:scale-[0.98]">
            <BiReset className="text-sm" />
            Reset
          </button>
        )}
      </div>

      <form
        className="px-4 sm:px-6 flex flex-col gap-4"
        onSubmit={handleSubmit}>
        {/* 1. Data Pribadi */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                inputMode="numeric"
                className={inputCls}
                value={form.tanggal_lahir}
                onChange={(e) =>
                  set("tanggal_lahir")(formatTanggalLahir(e.target.value))
                }
                placeholder="DD/MM/YYYY"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

        {/* 2. Akun Login */}
        <FormSection title="Akun Login">
          <Field label="Email" required>
            <input
              type="email"
              autoComplete="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="nama@email.com"
              required
            />
          </Field>

          <Field label="No. HP">
            <input
              type="tel"
              className={inputCls}
              value={form.no_hp}
              onChange={(e) => set("no_hp")(e.target.value)}
              placeholder="08xxxx"
            />
          </Field>

          <Field label="Kata Sandi" required hint="Minimal 6 karakter.">
            <div className="flex items-center rounded-xl border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <input
                type={passwordVisible ? "text" : "password"}
                autoComplete="new-password"
                className="w-full rounded-l-xl px-3.5 py-2.5 text-sm outline-none"
                value={form.password}
                onChange={(e) => set("password")(e.target.value)}
                placeholder="Masukkan kata sandi"
                minLength={6}
                required
              />
              <button
                type="button"
                aria-label="Tampilkan atau sembunyikan kata sandi"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="px-3.5 text-gray-500 transition-colors hover:text-gray-700">
                {passwordVisible ? (
                  <LuEye size={19} />
                ) : (
                  <LuEyeClosed size={19} />
                )}
              </button>
            </div>
          </Field>

          <Field label="Konfirmasi Kata Sandi" required>
            <input
              type={passwordVisible ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={passwordMismatch}
              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 ${
                passwordMismatch
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  : passwordMatch
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              }`}
              value={form.password2}
              onChange={(e) => set("password2")(e.target.value)}
              placeholder="Ulangi kata sandi"
              minLength={6}
              required
            />
            {passwordMismatch && (
              <p className="text-xs font-medium text-red-600">
                Kata sandi tidak sama.
              </p>
            )}
            {passwordMatch && (
              <p className="text-xs font-medium text-emerald-600">
                Kata sandi cocok.
              </p>
            )}
          </Field>
        </FormSection>

        {/* 3. Status Pegawai & NIP */}
        <FormSection
          title="Status Pegawai"
          subtitle="Hanya pegawai berstatus PNS yang wajib mengisi NIP dan berhak mengajukan Cuti.">
          <Field label="Status Pegawai" required>
            <select
              className={selectCls}
              value={form.status_pegawai}
              onChange={(e) => {
                const nextStatus = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  status_pegawai: nextStatus,
                  nip: nextStatus === "PNS" ? prev.nip : "",
                }));
              }}
              required>
              {STATUS_PEGAWAI_OPTIONS.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </Field>

          {isPns && (
            <Field label="NIP" required>
              <input
                className={inputCls}
                value={form.nip}
                onChange={(e) => set("nip")(e.target.value)}
                placeholder="Nomor Induk Pegawai"
                required
              />
            </Field>
          )}
        </FormSection>

        {/* 4. Tempat Kerja, Sub Unit & Atasan Langsung */}
        <FormSection
          title="Tempat Kerja & Atasan Langsung"
          subtitle="Atasan langsung ditetapkan otomatis sesuai unit/sub unit tempat kerja Anda.">
          {loadingMaster ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <Field label="Tempat Kerja" required>
                <select
                  className={selectCls}
                  value={form.unit_kerja_id}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      unit_kerja_id: e.target.value,
                      sub_unit_id: "",
                    }));
                  }}
                  required>
                  <option value="">Pilih tempat kerja</option>
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

              {/* Atasan Langsung otomatis */}
              {tempatKerjaLengkap &&
                (atasanOtomatis ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <BiUserCheck className="text-lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-emerald-700">
                        Atasan langsung otomatis ({atasanOtomatis.sumber})
                      </p>
                      <p className="text-sm font-semibold text-emerald-900 break-words">
                        {atasanOtomatis.nama}
                      </p>
                    </div>
                    <BiCheckCircle className="shrink-0 text-lg text-emerald-600" />
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs text-blue-700">
                    <HiOutlineInformationCircle className="mt-0.5 shrink-0 text-sm text-blue-500" />
                    <span>
                      Atasan langsung ditetapkan otomatis sesuai unit/sub unit
                      tempat kerja yang Anda pilih.
                    </span>
                  </div>
                ))}
            </>
          )}
        </FormSection>

        {/* 5. Profesi */}
        <FormSection
          title="Profesi"
          subtitle="Jabatan & posisi awal otomatis ditetapkan sebagai Staf dan dapat disesuaikan oleh admin nanti.">
          {loadingMaster ? (
            <Skeleton className="h-10 w-full rounded-xl" />
          ) : (
            <Field label="Profesi" required>
              <select
                className={selectCls}
                value={form.profesi_id}
                onChange={(e) => set("profesi_id")(e.target.value)}
                required>
                <option value="">Pilih profesi</option>
                {master?.profesi.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </FormSection>

        <button
          type="submit"
          disabled={submitting || loadingMaster}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60">
          {submitting ? (
            <>
              <Spinner />
              <span>Mendaftar...</span>
            </>
          ) : (
            "Daftar Akun"
          )}
        </button>

        <div className="flex items-center justify-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">Sudah punya akun?</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
        <Link to="/login">
          <button
            type="button"
            className="w-full rounded-2xl border border-blue-500 bg-white py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50">
            Masuk
          </button>
        </Link>
      </form>

      <ConfirmModal
        isOpen={confirmReset}
        title="Reset Formulir?"
        message="Semua data pendaftaran yang sudah Anda masukkan akan dihapus."
        confirmLabel="Ya, Reset"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
