import api from "./client";

export type StatusVerifikasiEmail = {
  sukses: boolean;
  terverifikasi: boolean;
  email: string;
  email_terverifikasi_at: string | null;
  menunggu: boolean;
  sisa_detik: number;
};

export type KirimVerifikasiEmailResponse = {
  sukses: boolean;
  pesan: string;
  terverifikasi: boolean;
  menunggu: boolean;
  sisa_detik: number;
  kirim_ulang_pada: string | null;
  errors?: Record<string, string>;
};

export const getStatusVerifikasi = async (): Promise<
  StatusVerifikasiEmail
> => {
  const res = await api.get("/verifikasi-email");
  return res.data;
};

export const kirimVerifikasi = async (
  email: string,
): Promise<KirimVerifikasiEmailResponse> => {
  const res = await api.post("/verifikasi-email", { email });
  return res.data;
};
