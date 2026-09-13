import type { LogEntry } from "../types/LogBookType";

export const newRow = (id: number): LogEntry => ({
  id,
  tanggal: new Date().toLocaleDateString("sv-SE"),
  jam: "",
  isi: "",
});

export const formatTanggal = (tanggal: string) => {
  const [y, m, d] = tanggal.split("-").map(Number);
  if (!y || !m || !d) return tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
};