import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  getTotalNotifications,
  readNotification,
  readdAllNotifications,
} from "../utils/api/Notification";
import type {
  NotifikasiBacaResponse,
  NotifikasiItem,
  NotifikasiListResponse,
  NotifikasiTotalResponse,
} from "../types/NotifikasiType";
import {
  dukungNotifikasiOs,
  tampilkanNotifikasiItem,
} from "../utils/OsNotification";

const INTERVAL_MS = 60_000;
const MAKS_NOTIF_OS = 3;

export default function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotifikasiItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const aktifRef = useRef(true);
  const intervalRef = useRef<number | null>(null);
  const lastIdRef = useRef<number | null>(null);
  const unreadRef = useRef(0);

  const kunciSimpan = user ? `notif_last_id:${user.id}` : null;

  useEffect(() => {
    if (!kunciSimpan) {
      lastIdRef.current = null;
      return;
    }
    const raw = window.localStorage.getItem(kunciSimpan);
    const angka = raw ? Number(raw) : NaN;
    lastIdRef.current = Number.isFinite(angka) ? angka : null;
  }, [kunciSimpan]);

  const prosesNotifikasiOs = useCallback(
    (list: NotifikasiItem[]) => {
      const idMaks = list.reduce((maks, n) => Math.max(maks, n.id), 0);
      const sebelumnya = lastIdRef.current;

      // kunjungan pertama (belum ada catatan): catat tanpa memunculkan notifikasi.
      if (sebelumnya !== null) {
        const baru = list
          .filter((n) => n.id > sebelumnya && !n.is_read)
          .sort((a, b) => a.id - b.id);
        if (dukungNotifikasiOs() && Notification.permission === "granted") {
          baru
            .slice(-MAKS_NOTIF_OS)
            .forEach((n) => void tampilkanNotifikasiItem(n));
        }
      }

      if (idMaks > (sebelumnya ?? 0)) {
        lastIdRef.current = idMaks;
        if (kunciSimpan)
          window.localStorage.setItem(kunciSimpan, String(idMaks));
      }
    },
    [kunciSimpan],
  );

  const refresh = useCallback(async () => {
    try {
      const res = (await getNotifications()) as NotifikasiListResponse;
      if (!aktifRef.current || !res?.sukses) return;
      const list = res.notifikasi ?? [];
      setItems(list);
      const baru = res.belum_dibaca ?? list.filter((n) => !n.is_read).length;
      setUnreadCount(baru);
      unreadRef.current = baru;
      setTotal(res.total ?? list.length);
      prosesNotifikasiOs(list);
    } catch {
      // biarkan data lama bila gagal
    } finally {
      if (aktifRef.current) setLoading(false);
    }
  }, [prosesNotifikasiOs]);

  const refreshBadge = useCallback(async () => {
    try {
      const res = (await getTotalNotifications()) as NotifikasiTotalResponse;
      if (!aktifRef.current || !res?.sukses) return;
      const jumlah = res.belum_dibaca ?? res.total ?? 0;
      setUnreadCount(jumlah);
      if (jumlah > unreadRef.current) {
        void refresh();
      } else {
        unreadRef.current = jumlah;
      }
    } catch {
      // endpoint badge opsional; abaikan bila gagal
    }
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    aktifRef.current = true;

    const mulai = () => {
      if (intervalRef.current !== null)
        window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(refreshBadge, INTERVAL_MS);
    };
    const berhenti = () => {
      if (intervalRef.current !== null)
        window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
        mulai();
      } else {
        berhenti();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    if (document.visibilityState === "visible") {
      mulai();
    }
    const idAwal = window.setTimeout(() => {
      if (document.visibilityState === "visible") refresh();
    }, 0);

    return () => {
      aktifRef.current = false;
      berhenti();
      window.clearTimeout(idAwal);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, refresh, refreshBadge]);

  const markRead = useCallback(async (id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    unreadRef.current = Math.max(0, unreadRef.current - 1);
    try {
      const res = (await readNotification(id)) as NotifikasiBacaResponse;
      if (res?.sukses && typeof res.belum_dibaca === "number") {
        setUnreadCount(Math.max(0, res.belum_dibaca));
        unreadRef.current = Math.max(0, res.belum_dibaca);
      }
    } catch {
      // optimistis; biarkan UI tetap menampilkan sebagai terbaca
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const belumDibaca = items.filter((n) => !n.is_read);
    if (belumDibaca.length === 0) return;

    try {
      const res = (await readdAllNotifications()) as NotifikasiBacaResponse;
      if (res?.sukses) {
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        unreadRef.current = 0;
        return;
      }
    } catch {
      // fallback: tandai satu per satu
    }

    for (const n of belumDibaca) {
      await markRead(n.id);
    }
  }, [items, markRead]);

  return { items, unreadCount, total, loading, refresh, markRead, markAllRead };
}
