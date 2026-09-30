export type PeriodeJadwal = {
  bulan: number;
  tahun: number;
  label: string;
  hari_dalam_bulan: number;
};

export type SubUnitJadwal = {
  id: number;
  nama: string;
  unit_nama: string;
};

export type ShiftOpsi = {
  id: number;
  kategori: string;
  jam_masuk: string;
  jam_pulang: string;
};

export type PegawaiJadwal = {
  id: number;
  nama_lengkap: string;
  unit_nama?: string | null;
  sub_unit_nama?: string | null;
};

export type GridJadwalPegawai = Record<string, Record<string, number>>;

export type KelolaJadwalResponse = {
  sukses: boolean;
  pesan?: string;
  periode: PeriodeJadwal;
  sub_unit_dipilih: SubUnitJadwal | null;
  sub_units: SubUnitJadwal[];
  shift: ShiftOpsi[];
  pegawai: PegawaiJadwal[];
  jadwal: GridJadwalPegawai;
  semua_pegawai: PegawaiJadwal[];
  jadwal_pegawai: GridJadwalPegawai;
  pegawai_bertugas: PegawaiJadwal[];
};

export type SimpanJadwalPegawaiPayload = {
  bulan: number;
  tahun: number;
  users: number[];
  grid: GridJadwalPegawai;
};

export type SimpanJadwalPegawaiResponse = {
  sukses: boolean;
  pesan: string;
  bulan: number;
  tahun: number;
  pegawai: number;
  disimpan: number;
};