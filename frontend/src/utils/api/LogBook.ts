import type { LogbookResponse } from "../../types/LogBookType";
import api from "./client";

export const saveLogBulk = async (data: { entri: { tanggal: string; jam: string; isi: string }[] }) => {
  const res = await api.post("/logbook/simpan-bulk", data);
  return res.data;
};

export const updateLogBook = async (data: { id: number; tanggal: string; jam: string; isi: string }) => {
  const res = await api.post("/logbook/ubah", data);
  return res.data;
};

export const deleteLogBook = async (id: number) => {
  const res = await api.delete(`/logbook/${id}`);
  return res.data;
};

export const getLogBooks = async (params?: { q?: string; bulan?: number; tahun?: number; hal?: number }): Promise<LogbookResponse> => {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.bulan) query.set("bulan", String(params.bulan));
  if (params?.tahun) query.set("tahun", String(params.tahun));
  if (params?.hal) query.set("hal", String(params.hal));

  const res = await api.get(`/logbook?${query.toString()}`);
  return res.data;
};

//template log book
export const getMyTemplate = async () => {
  const res = await api.get("/logbook/template");
  return res.data;
};

export const addTemplate = async (data: { isi: string }) => {
  const res = await api.post("/logbook/template", data);
  return res.data;
};

export const updateTemplate = async (data: { id: number; isi: string }) => {
  const res = await api.post("/logbook/template/ubah", data);
  return res.data;
};

export const deleteTemplate = async (id: number) => {
  const res = await api.delete(`/logbook/template/${id}`);
  return res.data;
};
