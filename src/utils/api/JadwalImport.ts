import type { ImportJadwalResponse } from "../../types/JadwalImportType";
import api from "./client";

const pad = (n: number) => String(n).padStart(2, "0");

export const downloadTemplateJadwal = async (
  bulan: number,
  tahun: number,
): Promise<string> => {
  const res = await api.get("/jadwal/template", {
    params: { bulan, tahun },
    responseType: "blob",
  });
  const namaBerkas = `template_jadwal_${tahun}-${pad(bulan)}.xlsx`;
  const url = URL.createObjectURL(res.data as Blob);
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = namaBerkas;
  document.body.appendChild(tautan);
  tautan.click();
  tautan.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  return namaBerkas;
};

export const importJadwal = async (
  file: File,
  bulan: number,
  tahun: number,
): Promise<ImportJadwalResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bulan", String(bulan));
  formData.append("tahun", String(tahun));

  const res = await api.post("/jadwal/import", formData);
  return res.data;
};
