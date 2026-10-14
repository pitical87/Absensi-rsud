import type { NotifikasiItem } from "../types/NotifikasiType";

export function mapNotifUrl(item: NotifikasiItem): string | null {
  if (item.kategori === "password") return "/profile";

  const url = item.url;
  if (!url || url.startsWith("admin/")) return null;
  if (url === "lembur") return "/lembur";
  if (url === "ubah-jadwal") return "/ubah-jadwal";
  if (url === "persetujuan") {
    const teks = item.isi.toLowerCase();
    if (teks.includes("lembur")) return "/persetujuan-lembur";
    if (teks.includes("jadwal")) return "/persetujuan-jadwal";
    return "/persetujuan";
  }
  return url.startsWith("/") ? url : `/${url}`;
}
