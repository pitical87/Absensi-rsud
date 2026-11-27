export type ShiftRingkas = {
  id?: number;
  kategori: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  lintas_hari?: boolean;
};

export type TanggalAlpaItem = {
  tanggal: string;
  hari: string;
  shift: ShiftRingkas | null;
  sudah_diajukan: boolean;
  pengajuan_id: number | null;
  status_pengajuan: string | null;
};

export type CekLupaAbsenResponse = {
  sukses: boolean;
  ada_jadwal: boolean;
  ada_alpa: boolean;
  tampil_tombol: boolean;
  total_alpa: number;
  total_menunggu: number;
  periode: {
    mulai: string;
    sampai: string;
  };
  tanggal_alpa: TanggalAlpaItem[];
};

export type PengajuanLupaAbsenItem = {
  id: number;
  tanggal: string;
  hari: string;
  shift: ShiftRingkas | null;
  alasan: string;
  lampiran: string | null;
  status: "Menunggu" | "Disetujui" | "Ditolak";
  catatan_keputusan: string | null;
  diproses_oleh: string | null;
  diproses_pada: string | null;
  absensi_id: number | null;
  created_at: string | null;
};

export type DaftarLupaAbsenResponse = CekLupaAbsenResponse & {
  atasan_langsung: string[];
  riwayat: PengajuanLupaAbsenItem[];
};

export type AjukanLupaAbsenResponse = {
  sukses: boolean;
  pesan: string;
  pengajuan_id?: number | null;
};

export type BatalLupaAbsenResponse = {
  sukses: boolean;
  pesan: string;
};

export type LupaAbsenMenungguTotalResponse = {
  sukses: boolean;
  total: number;
};

export type LupaAbsenMenungguItem = {
  id: number;
  pemohon: {
    id: number;
    nama: string;
    nip?: string | null;
    unit: string | null;
    sub_unit: string | null;
  };
  tanggal: string;
  hari: string;
  shift: ShiftRingkas | null;
  alasan: string;
  lampiran: string | null;
  diajukan_pada: string | null;
};

export type LupaAbsenMenungguResponse = {
  sukses: boolean;
  total: number;
  data: LupaAbsenMenungguItem[];
};

export type ProsesLupaAbsenPayload = {
  id: number;
  putusan: "setuju" | "tolak";
  catatan?: string;
};

export type ProsesLupaAbsenResponse = {
  sukses: boolean;
  pesan: string;
  status?: string | null;
  absensi_id?: number | null;
};

export type RiwayatPersetujuanLupaAbsenItem = {
  id: number;
  waktu: string | null;
  status: "Disetujui" | "Ditolak";
  catatan: string | null;
  pemohon: string;
  tanggal: string;
  shift: ShiftRingkas | null;
};

export type RiwayatPersetujuanLupaAbsenResponse = {
  sukses: boolean;
  riwayat: RiwayatPersetujuanLupaAbsenItem[];
};
