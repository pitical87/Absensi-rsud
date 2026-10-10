import { useMemo } from "react";
import { getAttRecords } from "../utils/api/Attendence";
import { GetTodayKey } from "../utils/DateUtils";
import useSharedQuery from "./useSharedQuery";

type SessionRecord = {
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

export default function useTodaySession(isDokter: boolean) {
  const { data, loading } = useSharedQuery<RiwayatRes>("riwayat", getAttRecords, { enabled: isDokter });

  const sessions = useMemo(() => {
    if (!isDokter) return [] as SessionRecord[];
    return (data?.riwayat ?? []).filter((r) => r.tanggal === GetTodayKey() || r.jam_pulang == null).sort((a, b) => (a.tanggal === b.tanggal ? a.jam_masuk.localeCompare(b.jam_masuk) : a.tanggal.localeCompare(b.tanggal)));
  }, [data, isDokter]);

  const latest = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const hasMasuk = isDokter && sessions.length > 0;
  const hasPulang = hasMasuk && latest?.jam_pulang != null;

  return { sessions, hasMasuk, hasPulang, latest, loading };
}
