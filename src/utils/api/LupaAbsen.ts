import type {
  AjukanLupaAbsenResponse,
  BatalLupaAbsenResponse,
  CekLupaAbsenResponse,
  DaftarLupaAbsenResponse,
  LupaAbsenMenungguResponse,
  LupaAbsenMenungguTotalResponse,
  ProsesLupaAbsenPayload,
  ProsesLupaAbsenResponse,
  RiwayatPersetujuanLupaAbsenResponse,
} from "../../types/LupaAbsenType";
import api from "./client";

export const cekLupaAbsen = async (): Promise<CekLupaAbsenResponse> => {
  const res = await api.get("/lupa-absen/cek");
  return res.data;
};

export const getLupaAbsenList = async (): Promise<DaftarLupaAbsenResponse> => {
  const res = await api.get("/lupa-absen");
  return res.data;
};

export const ajukanLupaAbsen = async (
  data: FormData,
): Promise<AjukanLupaAbsenResponse> => {
  const res = await api.post("/lupa-absen", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const batalLupaAbsen = async (
  id: number,
): Promise<BatalLupaAbsenResponse> => {
  const res = await api.delete(`/lupa-absen/${id}`);
  return res.data;
};

export const getLupaAbsenMenungguTotal =
  async (): Promise<LupaAbsenMenungguTotalResponse> => {
    const res = await api.get("/lupa-absen/total");
    return res.data;
  };

export const getLupaAbsenMenunggu =
  async (): Promise<LupaAbsenMenungguResponse> => {
    const res = await api.get("/lupa-absen/menunggu");
    return res.data;
  };

export const prosesLupaAbsen = async (
  data: ProsesLupaAbsenPayload,
): Promise<ProsesLupaAbsenResponse> => {
  const res = await api.post("/lupa-absen/proses", data);
  return res.data;
};

export const getRiwayatPersetujuanLupaAbsen =
  async (): Promise<RiwayatPersetujuanLupaAbsenResponse> => {
    const res = await api.get("/lupa-absen/riwayat-persetujuan");
    return res.data;
  };
