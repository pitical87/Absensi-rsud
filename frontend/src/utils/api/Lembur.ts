import type {
  AbsenLemburMasukResponse,
  AbsenLemburPayload,
  AbsenLemburPulangResponse,
  AjukanLemburPayload,
  AjukanLemburResponse,
  BatalLemburResponse,
  LemburListResponse,
  LemburMenungguResponse,
  LemburMenungguTotalResponse,
  ProsesLemburPayload,
  ProsesLemburResponse,
  RiwayatPersetujuanLemburResponse,
  StatusLemburResponse,
} from "../../types/LemburType";
import api from "./client";

export const getLemburList = async (): Promise<LemburListResponse> => {
  const res = await api.get("/lembur");
  return res.data;
};

export const ajukanLembur = async (
  data: AjukanLemburPayload,
): Promise<AjukanLemburResponse> => {
  const res = await api.post("/lembur", data);
  return res.data;
};

export const batalLembur = async (id: number): Promise<BatalLemburResponse> => {
  const res = await api.delete(`/lembur/${id}`);
  return res.data;
};

export const getLemburMenungguTotal = async (): Promise<LemburMenungguTotalResponse> => {
  const res = await api.get("/lembur/total");
  return res.data;
};

export const getLemburMenunggu = async (): Promise<LemburMenungguResponse> => {
  const res = await api.get("/lembur/menunggu");
  return res.data;
};

export const prosesLembur = async (
  data: ProsesLemburPayload,
): Promise<ProsesLemburResponse> => {
  const res = await api.post("/lembur/proses", data);
  return res.data;
};

export const getRiwayatPersetujuanLembur = async (): Promise<RiwayatPersetujuanLemburResponse> => {
  const res = await api.get("/lembur/riwayat-persetujuan");
  return res.data;
};

export const absenLemburMasuk = async (
  data: AbsenLemburPayload,
): Promise<AbsenLemburMasukResponse> => {
  const res = await api.post("/absen-lembur", data);
  return res.data;
};

export const absenLemburPulang = async (
  data: AbsenLemburPayload,
): Promise<AbsenLemburPulangResponse> => {
  const res = await api.put("/absen-lembur/pulang", data);
  return res.data;
};

export const getStatusLembur = async (
  params?: { tanggal?: string },
): Promise<StatusLemburResponse> => {
  const res = await api.get("/absen-lembur/status", { params });
  return res.data;
};