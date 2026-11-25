import api from "./client";

export type MappingSimrsStatus = {
  sukses: boolean;
  termapping: boolean;
  simrs_user_id: string | null;
};

export type CekSimrsResponse = {
  sukses: boolean;
  pesan?: string;
  data?: {
    nik: string;
    nama: string;
  } | null;
};

export type SimpanMappingSimrsResponse = {
  sukses: boolean;
  pesan: string;
  simrs_user_id?: string;
};

export const getMappingSimrs = async (): Promise<MappingSimrsStatus> => {
  const res = await api.get("/mapping-simrs");
  return res.data;
};

export const tesMappingSimrs = async (): Promise<CekSimrsResponse> => {
  const res = await api.get("/mapping-simrs/tes");
  return res.data;
};

export const cekSimrsId = async (id: string): Promise<CekSimrsResponse> => {
  const res = await api.get("/mapping-simrs/cek", { params: { id } });
  return res.data;
};

export const simpanMappingSimrs = async (
  simrs_user_id: string,
): Promise<SimpanMappingSimrsResponse> => {
  const res = await api.post("/mapping-simrs", { simrs_user_id });
  return res.data;
};
