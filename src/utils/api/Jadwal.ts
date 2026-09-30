import type {
  KelolaJadwalResponse,
  SimpanJadwalPegawaiPayload,
  SimpanJadwalPegawaiResponse,
} from "../../types/JadwalType";
import api from "./client";

export const getKelolaJadwal = async (
  bulan: number,
  tahun: number,
  subUnitId?: number,
): Promise<KelolaJadwalResponse> => {
  const res = await api.get("/jadwal/kelola", {
    params: {
      bulan,
      tahun,
      ...(subUnitId ? { sub_unit: subUnitId } : {}),
    },
  });
  return res.data;
};

export const simpanJadwalPegawai = async (
  data: SimpanJadwalPegawaiPayload,
): Promise<SimpanJadwalPegawaiResponse> => {
  const res = await api.post("/jadwal/kelola/pegawai", data);
  return res.data;
};