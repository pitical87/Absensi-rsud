import { createContext, useContext } from "react";

export type User = {
  id: number;
  nama_lengkap: string;
  email: string;
  role: string;
  unit_kerja: { id: number; nama: string } | null;
  sub_unit: { id: number; nama: string } | null;
  profesi: { id: number; nama: string } | null;
  shift: {
    id: number;
    kategori: string;
    jam_masuk: string;
    jam_pulang: string;
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

export type AuthContextType = {
  user: User | null;
  lokasi: Lokasi | null;
  isAuthenticated: boolean;
  loading: boolean;
  isDokter: boolean;
  setLokasi: (lokasi: Lokasi | null) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

export const useAuth = () => useContext(AuthContext);