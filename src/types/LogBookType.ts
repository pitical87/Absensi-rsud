// types
export type LogEntry = {
  id: number;
  tanggal: string;
  jam: string;
  isi: string;
};

export type LogbookEntry = {
  id: number;
  tanggal: string;
  jam: string;
  isi: string;
  is_verified: boolean;
  verified_at: string | null;
};

export type LogbookResponse = {
  sukses: boolean;
  total: number;
  halaman: number;
  per: number;
  totalHal: number;
  data: LogbookEntry[];
};

export type LogTemplate = {
  id: number;
  isi: string;
};

export type SimrsEntry = {
  tanggal: string;
  jam: string;
  isi: string;
  pesan?: string;
};

export type SimrsLogbookResponse = {
  sukses: boolean;
  pesan?: string;
  peringatan?: string[];
  jenis?: string;
  total_tindakan?: number;
  total_lab?: number;
  data: SimrsEntry[];
};
