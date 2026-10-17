import type { NotifikasiItem } from "../types/NotifikasiType";
import { mapNotifUrl } from "./NotifUrl";
import api from "./api/client";

function berdiriSebagaiPwaIos(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & {
    standalone?: boolean;
  };
  return nav.standalone === true;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
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

async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await api.get("/notifikasi/push/kunci");
    return res.data?.kunci_publik || res.data?.public_key || null;
  } catch {
    return null;
  }
}

export async function subscribeWebPush(): Promise<PushSubscription | null> {
  if (!dukungNotifikasiOs()) return null;
  if (!("PushManager" in window)) return null;
  if (Notification.permission !== "granted") {
    const perm = await izinNotifikasi();
    if (perm !== "granted") return null;
  }

  try {
    const registrasi = await navigator.serviceWorker.ready;
    const existing = await registrasi.pushManager.getSubscription();
    if (existing) {
      try {
        await api.post("/notifikasi/push/langganan", existing.toJSON());
      } catch {}
      return existing;
    }

    const vapid = await getVapidPublicKey();
    if (!vapid) return null;

    const subscription = await registrasi.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });

    try {
      await api.post("/notifikasi/push/langganan", subscription.toJSON());
    } catch {}

    return subscription;
  } catch {
    return null;
  }
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!dukungNotifikasiOs()) return;
  if (!("PushManager" in window)) return;

  try {
    const registrasi = await navigator.serviceWorker.ready;
    const existing = await registrasi.pushManager.getSubscription();
    if (!existing) return;

    const endpoint = existing.endpoint;
    try {
      await existing.unsubscribe();
    } catch {}

    try {
      await api.delete("/notifikasi/push/langganan", {
        data: { endpoint },
      });
    } catch {}
  } catch {}
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
