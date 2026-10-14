import { useEffect, useState } from "react";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FiCheckCircle } from "react-icons/fi";
import { useNavigate } from "react-router";
import useNotifications from "../hooks/useNotifications";
import type { NotifikasiItem, NotifikasiTipe } from "../types/NotifikasiType";
import { mapNotifUrl } from "../utils/NotifUrl";
import {
  dukungNotifikasiOs,
  izinNotifikasi,
  tampilkanNotifikasi,
} from "../utils/OsNotification";

const WARNA_TIPE: Record<NotifikasiTipe, string> = {
  info: "bg-blue-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  success: "bg-emerald-500",
};

function waktuRelatif(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const detik = Math.floor((Date.now() - t) / 1000);
  if (detik < 60) return "baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} mnt lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(t);
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { items, unreadCount, loading, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [izin, setIzin] = useState<NotificationPermission | null>(
    dukungNotifikasiOs() ? Notification.permission : null,
  );

  const aktifkanNotifikasi = async () => {
    const hasil = await izinNotifikasi();
    setIzin(hasil);
    if (hasil === "granted") {
      await tampilkanNotifikasi(
        "Notifikasi aktif",
        "Anda akan menerima notifikasi di perangkat ini",
        "/",
      );
    }
  };

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  const handleKlikItem = async (item: NotifikasiItem) => {
    setOpen(false);
    if (!item.is_read) await markRead(item.id);
    const target = mapNotifUrl(item);
    if (target) navigate(target);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="relative p-1 cursor-pointer rounded-full transition-colors hover:bg-gray-100"
        aria-label="Notifikasi">
        <IoIosNotificationsOutline className="text-2xl text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">
                  Notifikasi
                </h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700">
                  <FiCheckCircle size={14} />
                  Semua dibaca
                </button>
              )}
            </div>

            {izin === "default" && (
              <button
                type="button"
                onClick={aktifkanNotifikasi}
                className="flex w-full items-center justify-center gap-2 border-b border-gray-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100">
                <IoIosNotificationsOutline size={16} />
                Aktifkan notifikasi HP
              </button>
            )}

            <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
              {loading && items.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  Memuat...
                </div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  Tidak ada notifikasi.
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleKlikItem(item)}
                    className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      item.is_read ? "" : "bg-blue-50/60"
                    }`}>
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        WARNA_TIPE[item.tipe] ?? "bg-blue-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug text-gray-700">
                        {item.isi}
                      </p>
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        {item.kategori_label ?? "Umum"}
                        {waktuRelatif(item.dibuat_pada) && (
                          <> · {waktuRelatif(item.dibuat_pada)}</>
                        )}
                      </span>
                    </div>
                    {!item.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
