export type StatusLembur = "Menunggu" | "Disetujui" | "Ditolak";

export type AbsenLemburData = {
  waktu_masuk: string | null;
  waktu_pulang: string | null;
  status_masuk: string | null;
  durasi_menit: number | null;
  bintang: number | null;
};

export type PengajuanLembur = {
  id: number;
  tanggal: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  keterangan: string;
  status: StatusLembur;
  catatan_keputusan: string | null;
  diproses_pada: string | null;
  created_at: string;
  absen: AbsenLemburData | null;
};

export type LemburListResponse = {
  sukses: boolean;
  batas_jam: number;
  maks_jam: number;
  hari_ke_depan: number;
  riwayat: PengajuanLembur[];
  disetujui: PengajuanLembur[];
};

export type LemburPemohon = {
  id: number;
  nama: string;
  unit: string | null;
  sub_unit: string | null;
};

export type LemburMenunggu = {
  id: number;
  pemohon: LemburPemohon;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  keterangan: string;
  diajukan_pada: string | null;
};

export type LemburMenungguResponse = {
  sukses: boolean;
  total: number;
  data: LemburMenunggu[];
};

export type LemburMenungguTotalResponse = {
  sukses: boolean;
  total: number;
};

export type RiwayatPersetujuanLembur = {
  id: number;
  waktu: string | null;
  status: StatusLembur;
  pemohon: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
};

export type RiwayatPersetujuanLemburResponse = {
  sukses: boolean;
  riwayat: RiwayatPersetujuanLembur[];
};

export type AjukanLemburPayload = {
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  keterangan: string;
};

export type AjukanLemburResponse = {
  sukses: boolean;
  pesan: string;
  pengajuan_lembur_id: number;
};

export type BatalLemburResponse = {
  sukses: boolean;
  pesan: string;
};

export type ProsesLemburPayload = {
  id: number;
  putusan: "setuju" | "tolak";
  catatan?: string;
};

export type ProsesLemburResponse = {
  sukses: boolean;
  pesan: string;
  status: StatusLembur;
};

export type AbsenLemburPayload = {
  tanggal: string;
  lat: number;
  lng: number;
  akurasi?: number;
  foto?: string;
};

export type AbsenLemburMasukData = {
  absen_lembur_id: number;
  waktu: string;
  status: string;
  menit_terlambat: number;
  bintang: number;
};

export type AbsenLemburMasukResponse = {
  sukses: boolean;
  pesan: string;
  data: AbsenLemburMasukData;
};

export type AbsenLemburPulangData = {
  durasi_menit: number;
  bintang_pulang: number;
  bintang_harian: number;
};

export type AbsenLemburPulangResponse = {
  sukses: boolean;
  pesan: string;
  data: AbsenLemburPulangData;
};

export type StatusLemburResponse = {
  sukses: boolean;
  absen_masuk: string | null;
  absen_pulang: string | null;
  status_masuk: string | null;
  durasi_menit: number | null;
  bintang: number | null;
};