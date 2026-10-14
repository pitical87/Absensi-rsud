import { useEffect, useState } from "react";
import { getJadwalBulanan } from "../utils/api/Attendence";

export type SessionShift = {
  id: number;
  kategori: string;
  jam_masuk: string;
  jam_pulang: string;
  lintas_hari?: boolean;
} | null;

type JadwalBulananResponse = {
  sukses: boolean;
  data?: {
    tanggal: string;
    shift: {
      id: number;
      kategori: string;
      jam_masuk: string;
      jam_pulang: string;
      lintas_hari?: boolean;
    } | null;
  }[];
};

export default function useSessionShift(
  openSession: { tanggal: string } | null,
  enabled: boolean,
) {
  const [loaded, setLoaded] = useState<{
    key: string;
    shift: SessionShift;
  } | null>(null);

  const tanggal = openSession?.tanggal ?? null;
  const key = enabled && tanggal ? tanggal : null;

  const shift = loaded && loaded.key === key ? loaded.shift : null;
  const loading = key !== null && loaded?.key !== key;

  useEffect(() => {
    if (!key) return;

    const [tahun, bulan] = key.split("-").map(Number);
    let aktif = true;

    getJadwalBulanan(bulan, tahun)
      .then((res: JadwalBulananResponse) => {
        if (!aktif) return;
        const row = (res?.data ?? []).find((d) => d.tanggal === key);
        setLoaded({ key, shift: row?.shift ?? null });
      })
      .catch(() => {
        if (aktif) setLoaded({ key, shift: null });
      });

    return () => {
      aktif = false;
    };
  }, [key]);

  return { shift, loading };
}
