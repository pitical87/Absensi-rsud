import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  IoArrowBack,
  IoCloudUploadOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import { BiCalendarWeek, BiCalendarCheck } from "react-icons/bi";
import { FaRegCheckCircle, FaRegTrashAlt } from "react-icons/fa";
import TopNavbar from "../components/Client Page/TopNavbar";
import ConfirmModal from "../components/ConfirmModal";
import JadwalGridTable from "../components/Jadwal Page/JadwalGridTable";
import PegawaiPickerModal from "../components/Jadwal Page/PegawaiPickerModal";
import { useAuth, type Bawahan } from "../context/AuthContext";
import { getKelolaJadwal, simpanJadwalPegawai } from "../utils/api/Jadwal";
import type {
  GridJadwalPegawai,
  PegawaiJadwal,
  PeriodeJadwal,
  ShiftOpsi,
  SubUnitJadwal,
} from "../types/JadwalType";
import ImportJadwalSheet from "../components/Jadwal Page/ImportJadwalSheet";

const BULAN_ID = [
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

type SumberPegawai =
  | { jenis: "bawahan" }
  | { jenis: "sub_unit"; id: number }
  | { jenis: "semua" };

const pad = (n: number) => String(n).padStart(2, "0");

const kePegawaiJadwal = (b: Bawahan[]) =>
  b.map((x) => ({ id: x.id, nama_lengkap: x.nama }));

export default function KelolaJadwalPage() {
  const navigate = useNavigate();
  const { user, bawahan } = useAuth();

  const [sumber, setSumber] = useState<SumberPegawai>(() => {
    if (bawahan?.length) return { jenis: "bawahan" };
    if (user?.sub_unit?.id) return { jenis: "sub_unit", id: user.sub_unit.id };
    return { jenis: "semua" };
  });

  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<PeriodeJadwal | null>(null);
  const [subUnits, setSubUnits] = useState<SubUnitJadwal[]>([]);
  const [shiftList, setShiftList] = useState<ShiftOpsi[]>([]);
  const [daftarPegawai, setDaftarPegawai] = useState<PegawaiJadwal[]>([]);
  const [jadwalPegawai, setJadwalPegawai] = useState<GridJadwalPegawai>({});

  const [bulan, setBulan] = useState(() => new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(() => new Date().getFullYear());

  const [dipilih, setDipilih] = useState<PegawaiJadwal[]>([]);
  const [grid, setGrid] = useState<Record<string, Record<string, string>>>({});
  const [dirty, setDirty] = useState(false);
  const [isiKosong, setIsiKosong] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmSimpan, setConfirmSimpan] = useState(false);
  const [confirmKosong, setConfirmKosong] = useState(false);
  const [confirmGanti, setConfirmGanti] = useState(false);
  const [pendingAksi, setPendingAksi] = useState<(() => void) | null>(null);
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);

  const buatBaris = (
    sumber: GridJadwalPegawai,
    id: number,
  ): Record<string, string> => {
    const peta = sumber[String(id)] ?? {};
    return Object.fromEntries(
      Object.entries(peta).map(([t, s]) => [t, String(s)]),
    );
  };

  const refetch = useCallback(
    (idTetap: number[]) => {
      const subUnitKirim = sumber.jenis === "sub_unit" ? sumber.id : undefined;
      getKelolaJadwal(bulan, tahun, subUnitKirim)
        .then((res) => {
          if (!res.sukses) {
            toast.error(res.pesan || "Gagal memuat data.");
            return;
          }
          setPeriode(res.periode);
          setSubUnits(res.sub_units);
          setShiftList(res.shift);
          setJadwalPegawai(res.jadwal_pegawai);

          const daftarBaru =
            sumber.jenis === "sub_unit"
              ? res.pegawai
              : sumber.jenis === "bawahan"
                ? kePegawaiJadwal(bawahan ?? [])
                : res.semua_pegawai;
          setDaftarPegawai(daftarBaru);

          const tetap = idTetap
            .map((id) => daftarBaru.find((p) => p.id === id))
            .filter((p): p is PegawaiJadwal => Boolean(p));
          setDipilih(tetap);
          setGrid(() => {
            const next: Record<string, Record<string, string>> = {};
            for (const p of tetap) {
              next[String(p.id)] = buatBaris(res.jadwal_pegawai, p.id);
            }
            return next;
          });
          setDirty(false);
        })
        .catch(() => toast.error("Gagal memuat data jadwal."))
        .finally(() => setLoading(false));
    },
    [bulan, tahun, sumber, bawahan],
  );

  useEffect(() => {
    refetch([]);
  }, [refetch]);

  const ganti = (fn: () => void) => {
    if (dirty && dipilih.length) {
      setPendingAksi(() => fn);
      setConfirmGanti(true);
    } else {
      fn();
    }
  };

  const ubahPeriode = (b: number, t: number) => {
    ganti(() => {
      setBulan(b);
      setTahun(t);
    });
  };

  const ubahSumber = (baru: SumberPegawai) => {
    ganti(() => setSumber(baru));
  };

  const kembali = () => {
    ganti(() => navigate("/"));
  };

  const pilihPegawai = (p: PegawaiJadwal[]) => {
    setPickerOpen(false);
    const aksi = () => {
      setDipilih(p);
      setGrid((prev) => {
        const next: Record<string, Record<string, string>> = {};
        for (const pg of p) {
          next[String(pg.id)] =
            prev[String(pg.id)] ?? buatBaris(jadwalPegawai, pg.id);
        }
        return next;
      });
      setDirty(false);
    };
    if (dirty && dipilih.length) {
      setPendingAksi(() => aksi);
      setConfirmGanti(true);
    } else {
      aksi();
    }
  };

  const hapusDariPilihan = (id: number) => {
    setDipilih((prev) => prev.filter((p) => p.id !== id));
    setGrid((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      return next;
    });
    setDirty(true);
  };

  const ubahSel = (userId: number, tanggal: string, shiftId: string) => {
    setGrid((prev) => ({
      ...prev,
      [String(userId)]: { ...(prev[String(userId)] ?? {}), [tanggal]: shiftId },
    }));
    setDirty(true);
  };

  const isiSemuaBaris = (userId: number, shiftId: string) => {
    if (!shiftId || !periode) return;
    setGrid((prev) => {
      const baris = { ...(prev[String(userId)] ?? {}) };
      for (let d = 1; d <= periode.hari_dalam_bulan; d++) {
        const t = `${tahun}-${pad(bulan)}-${pad(d)}`;
        baris[t] = shiftId;
      }
      return { ...prev, [String(userId)]: baris };
    });
    setDirty(true);
  };

  const isiSemuaKosong = (shiftId: string) => {
    if (!shiftId || !periode) return;
    setGrid((prev) => {
      const next: Record<string, Record<string, string>> = {};
      for (const p of dipilih) {
        const baris = { ...(prev[String(p.id)] ?? {}) };
        for (let d = 1; d <= periode.hari_dalam_bulan; d++) {
          const t = `${tahun}-${pad(bulan)}-${pad(d)}`;
          if (!baris[t]) baris[t] = shiftId;
        }
        next[String(p.id)] = baris;
      }
      return next;
    });
    setIsiKosong("");
    setDirty(true);
  };

  const kosongkanSemua = () => {
    setGrid({});
    setDirty(true);
    setConfirmKosong(false);
  };

  const onSimpan = async () => {
    if (!dipilih.length) return;
    const payload: GridJadwalPegawai = {};
    for (const p of dipilih) {
      const baris = grid[String(p.id)] ?? {};
      const entri: Record<string, number> = {};
      for (const [tgl, id] of Object.entries(baris)) {
        if (id) entri[tgl] = Number(id);
      }
      payload[String(p.id)] = entri;
    }
    setSaving(true);
    try {
      const res = await simpanJadwalPegawai({
        bulan,
        tahun,
        users: dipilih.map((p) => p.id),
        grid: payload,
      });
      setConfirmSimpan(false);
      if (res.sukses) {
        toast.success(res.pesan);
        setDirty(false);
        refetch(dipilih.map((p) => p.id));
      } else {
        toast.error(res.pesan);
      }
    } catch (err: unknown) {
      setConfirmSimpan(false);
      const pesan = (
        err as {
          response?: { data?: { pesan?: string } };
        }
      )?.response?.data?.pesan;
      toast.error(pesan || "Gagal menyimpan jadwal. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const sudahAda = new Set(Object.keys(jadwalPegawai).map(Number));
  const terisi = Object.values(grid).reduce(
    (n, baris) => n + Object.values(baris).filter(Boolean).length,
    0,
  );

  return (
    <>
      <TopNavbar />
      <ConfirmModal
        isOpen={confirmSimpan}
        title="Simpan Jadwal?"
        message={
          dipilih.length
            ? `Jadwal ${dipilih.length} pegawai pada ${periode?.label ?? ""} akan diganti total sesuai grid yang tampil.`
            : "Simpan jadwal?"
        }
        confirmLabel="Ya, Simpan"
        cancelLabel="Batal"
        onConfirm={onSimpan}
        onCancel={() => setConfirmSimpan(false)}
      />
      <ConfirmModal
        isOpen={confirmKosong}
        title="Kosongkan Semua?"
        message="Seluruh isian di grid bulan ini akan dihapus untuk semua pegawai terpilih."
        confirmLabel="Ya, Kosongkan"
        cancelLabel="Batal"
        onConfirm={kosongkanSemua}
        onCancel={() => setConfirmKosong(false)}
      />
      <ConfirmModal
        isOpen={confirmGanti}
        title="Perubahan Belum Disimpan"
        message="Jadwal belum disimpan. Perubahan akan hilang jika melanjutkan."
        confirmLabel="Lanjutkan"
        cancelLabel="Batal"
        onConfirm={() => {
          if (pendingAksi) pendingAksi();
          setPendingAksi(null);
          setConfirmGanti(false);
        }}
        onCancel={() => {
          setPendingAksi(null);
          setConfirmGanti(false);
        }}
      />

      <ImportJadwalSheet
        isOpen={importOpen}
        bulan={bulan}
        tahun={tahun}
        labelPeriode={`${BULAN_ID[bulan - 1]} ${tahun}`}
        onClose={() => setImportOpen(false)}
        onImported={() => refetch(dipilih.map((p) => p.id))}
      />

      <section className="px-6 py-2 flex flex-col gap-2">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <BiCalendarWeek />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">
              Atur Jadwal Shift
            </h1>
            <p className="text-sm text-gray-500">
              Kelola jadwal pegawai per bulan.
            </p>
          </div>

          <button
            type="button"
            onClick={kembali}
            className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-600 flex items-center justify-center text-xl hover:bg-gray-200 transition shrink-0">
            <IoArrowBack />
          </button>
        </div>

        {loading && !periode ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  Periode
                </h2>
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  title="Import jadwal dari Excel"
                  className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl hover:bg-blue-200 transition shrink-0">
                  <IoCloudUploadOutline />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bulan
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => ubahPeriode(Number(e.target.value), tahun)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                    {BULAN_ID.map((nama, i) => (
                      <option key={nama} value={i + 1}>
                        {nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tahun
                  </label>
                  <select
                    value={tahun}
                    onChange={(e) => ubahPeriode(bulan, Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                    {[tahun - 1, tahun, tahun + 1].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sumber Pegawai
                  </label>
                  <select
                    value={
                      sumber.jenis === "sub_unit" ? sumber.id : sumber.jenis
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      ubahSumber(
                        v === "bawahan"
                          ? { jenis: "bawahan" }
                          : v === "semua"
                            ? { jenis: "semua" }
                            : { jenis: "sub_unit", id: Number(v) },
                      );
                    }}
                    disabled={!!bawahan?.length}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-600">
                    {bawahan?.length ? (
                      <option value="bawahan">
                        Bawahan Saya ({bawahan.length})
                      </option>
                    ) : (
                      <>
                        <option value="semua">Semua Pegawai</option>
                        {subUnits.map((su) => (
                          <option key={su.id} value={su.id}>
                            {su.unit_nama} — {su.nama}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-800">
                    Jadwal {periode?.label ?? ""}
                  </h2>
                  {dirty && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                      Belum disimpan
                    </span>
                  )}
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                    {dipilih.length} pegawai · {terisi} hari terisi
                  </span>
                </div>
              </div>

              {dipilih.length ? (
                <>
                  <JadwalGridTable
                    pegawai={dipilih}
                    bulan={bulan}
                    tahun={tahun}
                    hariDalamBulan={periode?.hari_dalam_bulan ?? 0}
                    shiftList={shiftList}
                    grid={grid}
                    onUbahSel={ubahSel}
                    onIsiSemua={isiSemuaBaris}
                    onHapus={hapusDariPilihan}
                  />

                  <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 items-end">
                    <div className="space-y-2">
                      <label
                        htmlFor="isi-kosong"
                        className="block text-sm font-medium text-gray-700">
                        Isi semua hari yang masih kosong (semua pegawai)
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <select
                          id="isi-kosong"
                          value={isiKosong}
                          onChange={(e) => isiSemuaKosong(e.target.value)}
                          className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                          <option value="">Pilih shift...</option>
                          {shiftList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.kategori} · {s.jam_masuk} - {s.jam_pulang}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setConfirmKosong(true)}
                          className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 active:scale-[0.98]">
                          <FaRegTrashAlt />
                          Kosongkan Semua
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmSimpan(true)}
                    disabled={saving || !dirty}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
                    <FaRegCheckCircle className="text-lg" />
                    <span>{saving ? "Menyimpan..." : "Simpan Jadwal"}</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
                    <BiCalendarCheck />
                  </div>
                  <h2 className="text-base font-semibold text-gray-800">
                    Pilih Pegawai untuk Mulai
                  </h2>
                  <p className="text-sm text-gray-500">
                    Ketuk tombol di bawah untuk memilih satu atau banyak pegawai
                    yang jadwalnya ingin diatur.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]">
                    <IoPersonAddOutline className="text-lg" />
                    Pilih Pegawai
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <PegawaiPickerModal
        key={pickerOpen ? "buka" : "tutup"}
        isOpen={pickerOpen}
        pegawai={daftarPegawai}
        sudahAdaJadwal={sudahAda}
        terpilihSebelumnya={dipilih.map((p) => p.id)}
        onPilih={pilihPegawai}
        onTutup={() => setPickerOpen(false)}
      />
    </>
  );
}
