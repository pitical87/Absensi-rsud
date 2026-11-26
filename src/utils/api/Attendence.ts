import api from "./client";

export const absen = async (data: {
  tipe: "datang" | "pulang";
  lat: number;
  lng: number;
  akurasi?: number;
  foto?: string;
  gps_anomali?: string[];
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

export const getPerformaBulan = async (params?: { bulan?: number; tahun?: number }) => {
  const res = await api.get("/performa/bulan", { params });
  return res.data;
};

export const getJadwal = async () => {
  const res = await api.get("/jadwal");
  return res.data;
};

export const rekapAbsensi = async (bulan: number, tahun: number) => {
  const res = await api.get(`rekap?bulan=${bulan}&tahun=${tahun}`);
  return res.data;
};

export const rekapSayaPdf = async (
  bulan: number,
  tahun: number,
): Promise<Blob> => {
  const res = await api.get("/rekap/pdf", {
    params: { bulan, tahun },
    responseType: "blob",
  });
  return res.data;
};

export const rekapBawahanPdf = async (
  bulan: number,
  tahun: number,
  userIds: number[],
): Promise<Blob> => {
  const res = await api.get("/rekap/bawahan/pdf", {
    params: {
      bulan,
      tahun,
      user_ids: userIds.join(","),
    },
    responseType: "blob",
  });
  return res.data;
};

export const getJadwalBulanan = async (bulan: number, tahun: number) => {
  const res = await api.get("/jadwal/bulanan", { params: { bulan, tahun } });
  return res.data;
};

export type PegawaiTeladanItem = {
  peringkat: number;
  pegawai_id: number;
  nama: string;
  unit: string | null;
  hari_tercatat: number;
  total_bintang: number;
  rata_bintang: number;
  jumlah_telat: number;
  hari_bintang_lima: number;
};

export type PegawaiTeladanRes = {
  sukses: boolean;
  periode: {
    bulan: number;
    tahun: number;
    label: string;
  };
  daftar: PegawaiTeladanItem[];
};

export const getPegawaiTeladan = async (params?: {
  bulan?: number;
  tahun?: number;
}): Promise<PegawaiTeladanRes> => {
  const res = await api.get("/pegawai-teladan", { params });
  return res.data;
};
