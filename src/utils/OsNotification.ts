import type { NotifikasiItem } from "../types/NotifikasiType";
import { mapNotifUrl } from "./NotifUrl";

function berdiriSebagaiPwaIos(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & {
    standalone?: boolean;
  };
  return nav.standalone === true;
}

export function dukungNotifikasiOs(): boolean {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;

  const ua = window.navigator.userAgent || "";
  const isIos = /iPad|iPhone|iPod/.test(ua);
  if (isIos && !berdiriSebagaiPwaIos()) return false;

  return true;
}

export async function izinNotifikasi(): Promise<NotificationPermission> {
  if (!dukungNotifikasiOs()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export async function tampilkanNotifikasi(
  title: string,
  body: string,
  url: string | null,
): Promise<void> {
  if (!dukungNotifikasiOs() || Notification.permission !== "granted") return;

  try {
    const registrasi = await navigator.serviceWorker.ready;
    await registrasi.showNotification(title, {
      body,
      icon: "/favicon.svg",
      data: { url: url ?? "/" },
    });
  } catch {
    // abaikan bila gagal menampilkan
  }
}

export async function tampilkanNotifikasiItem(
  item: NotifikasiItem,
): Promise<void> {
  await tampilkanNotifikasi(
    item.kategori_label ?? "Notifikasi",
    item.isi,
    mapNotifUrl(item),
  );
}
