import { createContext, useContext } from "react";

export type User = {
  id: number;
  nama_lengkap: string;
  email: string;
  email_verified_at?: string | null;
  role: string;
  unit_kerja: { id: number; nama: string } | null;
  sub_unit: { id: number; nama: string } | null;
  profesi: { id: number; nama: string } | null;
  shift: {
    id: number;
    kategori: string;
    jam_masuk: string;
    jam_pulang: string;
    lintas_hari: boolean;
  } | null;
  jabatan: { id: number; nama: string } | null;
  posisi: string;
  status_pegawai: string;

  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  agama?: string;
  no_hp?: string;
  nip?: string;
};

export type Lokasi = {
  lat: number;
  lng: number;
  radius: number;
};

export type Permission =
  | "approve.izin"
  | "approve.lembur"
  | "approve.jadwal"
  | "jadwal.kelola";

export type Bawahan = {
  id: number;
  email: string;
  nama: string;
};

export type HakAkses = {
  verifikasi_logbook: boolean;
  buat_jadwal: boolean;
  verifikasi_ijin: boolean;
  verifikasi_lembur: boolean;
  verifikasi_perubahan_jadwal: boolean;
};

export type AuthContextType = {
  user: User | null;
  lokasi: Lokasi | null;
  isAuthenticated: boolean;
  loading: boolean;
  isDokter: boolean;
  setLokasi: (lokasi: Lokasi | null) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  bawahan: Bawahan[] | null;
  setBawahan: (bawahan: Bawahan[] | null) => void;
  hakAkses: HakAkses | null;
  setHakAkses: (hakAkses: HakAkses | null) => void;
  can: (permission: Permission) => boolean;
};
export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

export const useAuth = () => useContext(AuthContext);
