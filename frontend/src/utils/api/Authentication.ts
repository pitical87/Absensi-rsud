import api from "./client";

export const login = async (email: string, password: string) => {
  const response = await api.post("/login", {
    email,
    password,
  });
  return response.data;
};

export type RegisterData = {
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string | null;
  jenis_kelamin: string;
  agama: string;
  email: string;
  no_hp: string;
  nip: string;
  unit_kerja_id: number | null;
  sub_unit_id: number | null;
  profesi_id: number | null;
  jabatan_kategori: string;
  jabatan_id: number | null;
  posisi: string;
  seksi_pembina_id: number | null;
  status_pegawai: string;
  password: string;
  password2: string;
};

export const register = async (data: RegisterData) => {
  const response = await api.post("/register", data);
  return response.data;
};

export type RegisterMaster = {
  sukses: boolean;
  unit: { id: number; nama: string; punya_sub: boolean }[];
  sub: Record<number, { id: number; nama: string }[]>;
  profesi: { id: number; nama: string }[];
  jabatan: Record<string, { id: number; nama: string }[]>;
  kategori_jabatan: string[];
  posisi: string[];
  seksi_pembina: { id: number; nama: string }[];
};

export const getRegisterMaster = async () => {
  const response = await api.get("/register/master");
  return response.data as RegisterMaster;
};

export const me = async () => {
  const response = await api.get("/me");
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/logout");
  return response.data;
};
