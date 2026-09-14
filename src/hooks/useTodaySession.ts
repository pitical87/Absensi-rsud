import { useEffect, useState } from "react";
import { getAttRecords } from "../utils/api/Attendence";
import { GetTodayKey } from "../utils/DateUtils";

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

export default function useTodaySession(isDokter: boolean) {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(isDokter);

  useEffect(() => {
    if (!isDokter) return;
    let aktif = true;
    getAttRecords()
      .then((res) => {
        if (!aktif || !res.sukses) return;
        const hariIni = (res.riwayat as SessionRecord[]).filter(
          (r) => r.tanggal == GetTodayKey() || r.jam_pulang == null,
        );
        hariIni.sort((a, b) =>
          a.tanggal == b.tanggal
            ? a.jam_masuk.localeCompare(b.jam_masuk)
            : a.tanggal.localeCompare(b.tanggal),
        );
        setSessions(hariIni);
      })
      .catch(() => {})
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [isDokter]);

  const latest = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  const hasMasuk = isDokter && sessions.length > 0;
  const hasPulang = hasMasuk && latest?.jam_pulang != null;

  return { sessions, hasMasuk, hasPulang, latest, loading };
}
