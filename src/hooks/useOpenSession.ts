import { getAttRecords } from "../utils/api/Attendence";
import useSharedQuery from "./useSharedQuery";

export type SessionRecord = {
  tanggal: string;
  hari: string;
  tanggal_label: string;
  jam_masuk: string;
  jam_pulang: string | null;
  status: string;
  status_pulang: string | null;
  menit_terlambat: number;
  menit_awal_pulang: number;
  bintang_masuk: number | null;
  bintang_pulang: number | null;
  bintang_harian: number | null;
};

type RiwayatRes = { sukses: boolean; riwayat: SessionRecord[] };

export default function useOpenSession() {
  const { data, loading } = useSharedQuery<RiwayatRes>("riwayat", getAttRecords);
  const records = data?.riwayat ?? [];
  const openSession = records.find((r) => r.jam_pulang == null) ?? null;

  return { records, openSession, loading };
}
