import type {
  AjukanPerubahanJadwalPayload,
  AjukanPerubahanJadwalResponse,
  BatalPerubahanJadwalResponse,
  MenungguPerubahanJadwalResponse,
  MenungguPerubahanJadwalTotalResponse,
  PerubahanJadwalListResponse,
  ProsesPerubahanJadwalPayload,
  ProsesPerubahanJadwalResponse,
  RiwayatPersetujuanPerubahanJadwalResponse,
  ShiftDaftarResponse,
} from "../../types/PerubahanJadwalType";
import api from "./client";

export const getPerubahanJadwal = async (): Promise<PerubahanJadwalListResponse> => {
  const res = await api.get("/perubahan-jadwal");
  return res.data;
};

export const getPerubahanJadwalShifts = async (): Promise<ShiftDaftarResponse> => {
  const res = await api.get("/perubahan-jadwal/shift");
  return res.data;
};

export const ajukanPerubahanJadwal = async (
  data: AjukanPerubahanJadwalPayload,
): Promise<AjukanPerubahanJadwalResponse> => {
  const res = await api.post("/perubahan-jadwal", data);
  return res.data;
};

export const batalPerubahanJadwal = async (id: number): Promise<BatalPerubahanJadwalResponse> => {
  const res = await api.delete(`/perubahan-jadwal/${id}`);
  return res.data;
};

export const getPerubahanJadwalMenungguTotal = async (): Promise<MenungguPerubahanJadwalTotalResponse> => {
  const res = await api.get("/perubahan-jadwal/total");
  return res.data;
};

export const getPerubahanJadwalMenunggu = async (): Promise<MenungguPerubahanJadwalResponse> => {
  const res = await api.get("/perubahan-jadwal/menunggu");
  return res.data;
};

export const prosesPerubahanJadwal = async (
  data: ProsesPerubahanJadwalPayload,
): Promise<ProsesPerubahanJadwalResponse> => {
  const res = await api.post("/perubahan-jadwal/proses", data);
  return res.data;
};

export const getRiwayatPersetujuanPerubahanJadwal = async (): Promise<RiwayatPersetujuanPerubahanJadwalResponse> => {
  const res = await api.get("/perubahan-jadwal/riwayat-persetujuan");
  return res.data;
};