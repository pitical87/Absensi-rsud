import { useEffect, useState } from "react";
import { getAttRecords } from "../utils/api/Attendence";

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

export default function useOpenSession() {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [openSession, setOpenSession] = useState<SessionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktif = true;
    getAttRecords()
      .then((res) => {
        if (!aktif || !res.sukses) return;
        const riwayat = (res.riwayat as SessionRecord[]) ?? [];
        setRecords(riwayat);
        setOpenSession(riwayat.find((r) => r.jam_pulang == null) ?? null);
      })
      .catch(() => {
        if (aktif) setRecords([]);
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  return { records, openSession, loading };
}