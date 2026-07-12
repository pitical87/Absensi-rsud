import api from "./client";

export const absen = async (data: {
  tipe: "datang" | "pulang";
  lat: number;
  lng: number;
  akurasi?: number;
  foto?: string;
}) => {
  const response = await api.post("/absen", data);
  return response.data;
};

export const getStatus = async () => {
  const res = await api.get("/status");
  return res.data;
};

export const getAttRecords = async () => {
  const res = await api.get("/riwayat");
  return res.data;
};

export const getStatistic = async () => {
  const res = await api.get("/statistik");
  return res.data;
};
