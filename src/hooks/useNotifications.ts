import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getNotifications, getTotalNotifications, readNotification, readdAllNotifications } from "../utils/api/Notification";
import type { NotifikasiBacaResponse, NotifikasiItem, NotifikasiListResponse, NotifikasiTotalResponse } from "../types/NotifikasiType";

const INTERVAL_MS = 60_000;

export default function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotifikasiItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const aktifRef = useRef(true);
  const intervalRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = (await getNotifications()) as NotifikasiListResponse;
      if (!aktifRef.current || !res?.sukses) return;
      const list = res.notifikasi ?? [];
      setItems(list);
      setUnreadCount(res.belum_dibaca ?? list.filter((n) => !n.is_read).length);
      setTotal(res.total ?? list.length);
    } catch {
      // biarkan data lama bila gagal
    } finally {
      if (aktifRef.current) setLoading(false);
    }
  }, []);

  const refreshBadge = useCallback(async () => {
    try {
      const res = (await getTotalNotifications()) as NotifikasiTotalResponse;
      if (!aktifRef.current || !res?.sukses) return;
      setUnreadCount(res.belum_dibaca ?? res.total ?? 0);
    } catch {
      // endpoint badge opsional; abaikan bila gagal
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    aktifRef.current = true;

    const mulai = () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(refreshBadge, INTERVAL_MS);
    };
    const berhenti = () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
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
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      const res = (await readNotification(id)) as NotifikasiBacaResponse;
      if (res?.sukses && typeof res.belum_dibaca === "number") {
        setUnreadCount(Math.max(0, res.belum_dibaca));
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
