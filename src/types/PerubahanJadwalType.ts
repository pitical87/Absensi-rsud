export type StatusPengajuanJadwal = "Menunggu" | "Disetujui" | "Ditolak";

export type ShiftInfo = {
  id: number;
  kategori: string;
  jam_masuk: string;
  jam_pulang: string;
  label?: string;
};

export type PengajuanAktif = {
  id: number;
  status: "Menunggu" | "Disetujui";
};

export type JadwalMendatang = {
  tanggal: string;
  hari: string;
  shift: ShiftInfo | null;
  bisa_ajukan: boolean;
  alasan_blok: string | null;
  batas_waktu: string | null;
  pengajuan_aktif: PengajuanAktif | null;
};

export type RiwayatPengajuanJadwal = {
  id: number;
  tanggal: string;
  shift_lama: string | null;
  shift_baru: string | null;
  alasan: string;
  status: StatusPengajuanJadwal;
  catatan_keputusan: string | null;
  diproses_pada: string | null;
  created_at: string | null;
};

export type PerubahanJadwalListResponse = {
  sukses: boolean;
  batas_jam: number;
  jadwal: JadwalMendatang[];
  riwayat: RiwayatPengajuanJadwal[];
};

export type ShiftDaftarResponse = {
  sukses: boolean;
  data: ShiftInfo[];
};

export type AjukanPerubahanJadwalPayload = {
  tanggal: string;
  shift_baru_id: number;
  alasan: string;
};

export type AjukanPerubahanJadwalResponse = {
  sukses: boolean;
  pesan: string;
  pengajuan_jadwal_id: number | null;
};

export type BatalPerubahanJadwalResponse = {
  sukses: boolean;
  pesan: string;
};

export type PemohonJadwal = {
  id: number;
  nama: string;
  unit: string | null;
  sub_unit: string | null;
};

export type MenungguPerubahanJadwal = {
  id: number;
  pemohon: PemohonJadwal;
  tanggal: string;
  shift_lama: string | null;
  shift_baru: ShiftInfo | null;
  alasan: string;
  diajukan_pada: string | null;
};

export type MenungguPerubahanJadwalResponse = {
  sukses: boolean;
  total: number;
  data: MenungguPerubahanJadwal[];
};

export type MenungguPerubahanJadwalTotalResponse = {
  sukses: boolean;
  total: number;
};

export type ProsesPerubahanJadwalPayload = {
  id: number;
  putusan: "setuju" | "tolak";
  catatan?: string;
};

export type ProsesPerubahanJadwalResponse = {
  sukses: boolean;
  pesan: string;
  status: StatusPengajuanJadwal;
};

export type RiwayatPersetujuanPerubahanJadwal = {
  id: number;
  waktu: string | null;
  status: StatusPengajuanJadwal;
  catatan: string | null;
  pemohon: string | null;
  tanggal: string;
  shift_lama: string | null;
  shift_baru: string | null;
};

export type RiwayatPersetujuanPerubahanJadwalResponse = {
  sukses: boolean;
  riwayat: RiwayatPersetujuanPerubahanJadwal[];
};