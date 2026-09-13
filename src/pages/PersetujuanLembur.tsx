import { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { BiCheckCircle, BiTimeFive } from "react-icons/bi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  getLemburMenunggu,
  getRiwayatPersetujuanLembur,
  prosesLembur,
} from "../utils/api/Lembur";
import type {
  LemburMenunggu,
  RiwayatPersetujuanLembur,
} from "../types/LemburType";
import ConfirmModal from "../components/ConfirmModal";
import TopNavbar from "../components/Client Page/TopNavbar";

const BULAN = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function tglId(tgl: string): string {
  const [y, m, d] = tgl.split("-").map(Number);
  return `${d} ${BULAN[m] ?? m} ${y}`;
}

function tglWaktu(iso: string): string {
  const t = iso.includes("T") ? iso : iso.replace(" ", "T");
  const d = new Date(t);
  if (isNaN(d.getTime())) return iso;
  return `${tglId(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)} · ${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
}

const STATUS_BADGE: Record<string, string> = {
  Disetujui: "bg-green-100 text-green-700",
  Ditolak: "bg-red-100 text-red-700",
  Menunggu: "bg-amber-100 text-amber-700",
};

export default function PersetujuanLembur() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [daftar, setDaftar] = useState<LemburMenunggu[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatPersetujuanLembur[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [catatanMap, setCatatanMap] = useState<Record<number, string>>({});
  const [confirm, setConfirm] = useState<{
    open: boolean;
    id: number;
    putusan: "setuju" | "tolak";
  }>({ open: false, id: 0, putusan: "setuju" });

  const refetch = () => {
    Promise.all([getLemburMenunggu(), getRiwayatPersetujuanLembur()])
      .then(([menungguRes, riwayatRes]) => {
        if (menungguRes.sukses) setDaftar(menungguRes.data ?? []);
        if (riwayatRes.sukses) setRiwayat(riwayatRes.riwayat ?? []);
      })
      .catch(() => {
        toast.error("Gagal memuat data persetujuan.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
  }, []);

  const handleProses = async () => {
    const { id, putusan } = confirm;
    setSubmittingId(id);
    try {
      const res = await prosesLembur({
        id,
        putusan,
        catatan: catatanMap[id] || undefined,
      });
      toast.success(res.pesan);
      setConfirm({ open: false, id: 0, putusan: "setuju" });
      setCatatanMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setDaftar((prev) => prev.filter((i) => i.id !== id));
      refetch();
    } catch (err: unknown) {
      const pesan = (err as {
        response?: { data?: { pesan?: string } };
      })?.response?.data?.pesan;
      toast.error(pesan || "Gagal memproses pengajuan.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <>
      <TopNavbar />
      <section className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-4">
        <button
          onClick={() => navigate("/")}
          className="rounded-xl p-2 transition hover:bg-gray-100">
          <IoArrowBack className="text-xl text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">
          Persetujuan Lembur
        </h1>
      </section>

      <div className="space-y-6 p-5">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        )}

        {!loading && (
          <>
            {/* ===== SECTION: Menunggu Persetujuan ===== */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1">
                    <BiTimeFive className="h-4 w-4 text-blue-600" />
                    <h2 className="font-bold text-slate-800">
                      Menunggu Persetujuan Saya
                    </h2>
                  </div>
                  <p className="mt-3 max-w-5xl text-sm leading-7 text-slate-500">
                    Anda melihat halaman ini karena posisi Anda{" "}
                    <span className="font-semibold text-slate-700">
                      ({user?.posisi})
                    </span>{" "}
                    adalah atasan langsung dari pegawai pemohon lembur.
                  </p>
                </div>
                <span className="flex shrink-0 items-center rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-700">
                  {daftar.length} Pengajuan
                </span>
              </div>

              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-[900px] w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="px-5 py-4">Pegawai</th>
                      <th className="px-5 py-4">Tanggal</th>
                      <th className="px-5 py-4">Jam</th>
                      <th className="px-5 py-4">Durasi</th>
                      <th className="px-5 py-4">Keterangan</th>
                      <th className="px-5 py-4 min-w-[260px]">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftar.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100 align-top text-sm text-slate-700">
                        <td className="px-5 py-5">
                          <strong className="text-slate-800">
                            {item.pemohon.nama}
                          </strong>
                          <p className="mt-1 text-xs text-slate-400">
                            {item.pemohon.sub_unit ?? item.pemohon.unit ?? "—"}
                          </p>
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          {tglId(item.tanggal)}
                        </td>
                        <td className="px-5 py-5 whitespace-nowrap">
                          {item.jam_mulai} - {item.jam_selesai}
                        </td>
                        <td className="px-5 py-5 text-right">
                          {item.durasi_jam} jam
                        </td>
                        <td className="px-5 py-5 text-xs">
                          {item.keterangan}
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex flex-col gap-2">
                            <textarea
                              rows={2}
                              placeholder="Catatan (opsional)…"
                              value={catatanMap[item.id] ?? ""}
                              onChange={(e) =>
                                setCatatanMap((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              disabled={submittingId === item.id}
                              className="w-full min-w-[120px] resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                            />
                            <div className="flex gap-3">
                              <button
                                disabled={submittingId === item.id}
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    id: item.id,
                                    putusan: "setuju",
                                  })
                                }
                                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
                                Setujui
                              </button>
                              <button
                                disabled={submittingId === item.id}
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    id: item.id,
                                    putusan: "tolak",
                                  })
                                }
                                className="rounded-xl bg-red-100 px-6 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-200 disabled:opacity-50">
                                Tolak
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {daftar.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-sm text-slate-500">
                          Tidak ada pengajuan lembur yang menunggu keputusan
                          Anda saat ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ===== SECTION: Riwayat Keputusan ===== */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
              <div className="flex items-center gap-3">
                <BiCheckCircle className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-800">
                  Riwayat Keputusan Saya
                </h2>
              </div>

              <div className="mt-6 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="px-5 py-4">Waktu</th>
                      <th className="px-5 py-4">Pegawai</th>
                      <th className="px-5 py-4">Tanggal</th>
                      <th className="px-5 py-4">Jam</th>
                      <th className="px-5 py-4">Putusan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.map((r) => (
                      <tr
                        key={r.id}
                        className="border-t border-slate-100 text-sm text-slate-700">
                        <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                          {r.waktu ? tglWaktu(r.waktu) : "—"}
                        </td>
                        <td className="px-5 py-4">{r.pemohon}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {tglId(r.tanggal)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {r.jam_mulai} - {r.jam_selesai}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_BADGE[r.status] ??
                              "bg-gray-100 text-gray-500"
                            }`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {riwayat.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-sm text-slate-500">
                          Belum ada riwayat keputusan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirm.open}
        title={
          confirm.putusan === "setuju"
            ? "Setujui Pengajuan Lembur?"
            : "Tolak Pengajuan Lembur?"
        }
        message={
          confirm.putusan === "setuju"
            ? "Pengajuan lembur akan disetujui dan pegawai dapat mulai absen lembur."
            : "Tolak pengajuan lembur ini? Pegawai tidak dapat mengabsen lembur."
        }
        confirmLabel={
          confirm.putusan === "setuju" ? "Ya, Setujui" : "Ya, Tolak"
        }
        onConfirm={handleProses}
        onCancel={() => setConfirm({ open: false, id: 0, putusan: "setuju" })}
      />
    </>
  );
}