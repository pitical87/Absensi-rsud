export type NotifikasiTipe = "info" | "warning" | "danger" | "success";

export type NotifikasiItem = {
  id: number;
  isi: string;
  tipe: NotifikasiTipe;
  kategori: string | null;
  kategori_label?: string | null;
  url: string | null;
  is_read: boolean;
  dibuat_pada: string;
};

export type NotifikasiListResponse = {
  sukses: boolean;
  notifikasi?: NotifikasiItem[];
  total?: number;
  halaman?: number;
  halaman_total?: number;
  per_halaman?: number;
  belum_dibaca?: number;
};

export type NotifikasiTotalResponse = {
  sukses: boolean;
  belum_dibaca?: number;
  total?: number;
};

export type NotifikasiBacaResponse = {
  sukses: boolean;
  pesan?: string;
  belum_dibaca?: number;
};