import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  IoArrowBack,
  IoPersonAddOutline,
} from "react-icons/io5";
import { BiCalendarWeek, BiCalendarCheck } from "react-icons/bi";
import { FaRegCheckCircle, FaRegTrashAlt } from "react-icons/fa";
import TopNavbar from "../components/Client Page/TopNavbar";
import ConfirmModal from "../components/ConfirmModal";
import MonthGrid from "../components/Jadwal Page/MonthGrid";
import PegawaiPickerModal from "../components/Jadwal Page/PegawaiPickerModal";
import {
  getKelolaJadwal,
  simpanJadwalPegawai,
} from "../utils/api/Jadwal";
import type {
  GridJadwalPegawai,
  PegawaiJadwal,
  PeriodeJadwal,
  ShiftOpsi,
  SubUnitJadwal,
} from "../types/JadwalType";

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

const pad = (n: number) => String(n).padStart(2, "0");

export default function KelolaJadwalPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<PeriodeJadwal | null>(null);
  const [subUnits, setSubUnits] = useState<SubUnitJadwal[]>([]);
  const [shiftList, setShiftList] = useState<ShiftOpsi[]>([]);
  const [daftarPegawai, setDaftarPegawai] = useState<PegawaiJadwal[]>([]);
  const [jadwalPegawai, setJadwalPegawai] = useState<GridJadwalPegawai>({});

  const [bulan, setBulan] = useState(() => new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(() => new Date().getFullYear());
  const [subUnitId, setSubUnitId] = useState<number | null>(null);

  const [dipilih, setDipilih] = useState<PegawaiJadwal | null>(null);
  const [nilai, setNilai] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [isiKosong, setIsiKosong] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmSimpan, setConfirmSimpan] = useState(false);
  const [confirmKosong, setConfirmKosong] = useState(false);
  const [confirmGanti, setConfirmGanti] = useState(false);
  const [pendingAksi, setPendingAksi] = useState<(() => void) | null>(null);
  const [saving, setSaving] = useState(false);

  const buatNilai = (
    grid: GridJadwalPegawai,
    id: number,
  ): Record<string, string> => {
    const peta = grid[String(id)] ?? {};
    return Object.fromEntries(
      Object.entries(peta).map(([t, s]) => [t, String(s)]),
    );
  };

  const refetch = useCallback(
    (idTetap: number | null) => {
      getKelolaJadwal(bulan, tahun, subUnitId ?? undefined)
        .then((res) => {
          if (!res.sukses) {
            toast.error(res.pesan || "Gagal memuat data.");
            return;
          }
          setPeriode(res.periode);
          setSubUnits(res.sub_units);
          setShiftList(res.shift);
          setJadwalPegawai(res.jadwal_pegawai);
          setDaftarPegawai(subUnitId ? res.pegawai : res.semua_pegawai);

          const daftarBaru = subUnitId ? res.pegawai : res.semua_pegawai;
          const tetap =
            idTetap === null
              ? null
              : (daftarBaru.find((p) => p.id === idTetap) ?? null);
          setDipilih(tetap);
          setNilai(tetap ? buatNilai(res.jadwal_pegawai, tetap.id) : {});
          setDirty(false);
        })
        .catch(() => toast.error("Gagal memuat data jadwal."))
        .finally(() => setLoading(false));
    },
    [bulan, tahun, subUnitId],
  );

  useEffect(() => {
    refetch(null);
  }, [refetch]);

  const ganti = (fn: () => void) => {
    if (dirty && dipilih) {
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

  const ubahSubUnit = (id: number | null) => {
    ganti(() => setSubUnitId(id));
  };

  const kembali = () => {
    ganti(() => navigate("/"));
  };

  const pilihPegawai = (p: PegawaiJadwal) => {
    setPickerOpen(false);
    const aksi = () => {
      setDipilih(p);
      setNilai(buatNilai(jadwalPegawai, p.id));
      setDirty(false);
    };
    if (dirty && dipilih) {
      setPendingAksi(() => aksi);
      setConfirmGanti(true);
    } else {
      aksi();
    }
  };

  const ubahSel = (tgl: string, id: string) => {
    setNilai((prev) => ({ ...prev, [tgl]: id }));
    setDirty(true);
  };

  const isiSemuaKosong = (id: string) => {
    if (!id || !periode) return;
    setNilai((prev) => {
      const next = { ...prev };
      for (let d = 1; d <= periode.hari_dalam_bulan; d++) {
        const t = `${tahun}-${pad(bulan)}-${pad(d)}`;
        if (!next[t]) next[t] = id;
      }
      return next;
    });
    setIsiKosong("");
    setDirty(true);
  };

  const kosongkanSemua = () => {
    setNilai({});
    setDirty(true);
    setConfirmKosong(false);
  };

  const onSimpan = async () => {
    if (!dipilih) return;
    const entri: Record<string, number> = {};
    for (const [tgl, id] of Object.entries(nilai)) {
      if (id) entri[tgl] = Number(id);
    }
    setSaving(true);
    try {
      const res = await simpanJadwalPegawai({
        bulan,
        tahun,
        users: [dipilih.id],
        grid: { [dipilih.id]: entri },
      });
      setConfirmSimpan(false);
      if (res.sukses) {
        toast.success(res.pesan);
        setDirty(false);
        refetch(dipilih.id);
      } else {
        toast.error(res.pesan);
      }
    } catch (err: unknown) {
      setConfirmSimpan(false);
      const pesan = (err as {
        response?: { data?: { pesan?: string } };
      })?.response?.data?.pesan;
      toast.error(pesan || "Gagal menyimpan jadwal. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const sudahAda = new Set(Object.keys(jadwalPegawai).map(Number));
  const terisi = Object.values(nilai).filter(Boolean).length;

  return (
    <>
      <TopNavbar />
      <ConfirmModal
        isOpen={confirmSimpan}
        title="Simpan Jadwal?"
        message={
          dipilih
            ? `Jadwal ${dipilih.nama_lengkap} pada ${periode?.label ?? ""} akan diganti total sesuai grid yang tampil.`
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
        message="Seluruh isian di grid bulan ini akan dihapus untuk pegawai terpilih."
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
              <h2 className="text-base font-semibold text-gray-800">Periode</h2>
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
                    Sub Unit
                  </label>
                  <select
                    value={subUnitId ?? ""}
                    onChange={(e) =>
                      ubahSubUnit(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                    <option value="">Semua Pegawai</option>
                    {subUnits.map((su) => (
                      <option key={su.id} value={su.id}>
                        {su.unit_nama} — {su.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {dipilih ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {dipilih.nama_lengkap}
                    </p>
                    {dipilih.sub_unit_nama ? (
                      <p className="truncate text-xs text-gray-500">
                        {dipilih.unit_nama ?? ""} — {dipilih.sub_unit_nama}
                      </p>
                    ) : (
                      <p className="truncate text-xs text-gray-500">
                        {dipilih.unit_nama ?? ""}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {dirty && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        Belum disimpan
                      </span>
                    )}
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      {terisi}/{periode?.hari_dalam_bulan ?? 0} hari
                    </span>
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                      <IoPersonAddOutline className="text-base" />
                      Ganti
                    </button>
                  </div>
                </div>

                <MonthGrid
                  bulan={bulan}
                  tahun={tahun}
                  hariDalamBulan={periode?.hari_dalam_bulan ?? 0}
                  shiftList={shiftList}
                  nilai={nilai}
                  onChange={ubahSel}
                />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Isi semua hari yang masih kosong
                    </label>
                    <select
                      value={isiKosong}
                      onChange={(e) => isiSemuaKosong(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                      <option value="">Pilih shift...</option>
                      {shiftList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.kategori} · {s.jam_masuk} - {s.jam_pulang}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gray-700 opacity-0">
                      .
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmKosong(true)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 active:scale-[0.98]">
                      <FaRegTrashAlt />
                      Kosongkan Semua
                    </button>
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
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
                  <BiCalendarCheck />
                </div>
                <h2 className="text-base font-semibold text-gray-800">
                  Pilih Pegawai untuk Mulai
                </h2>
                <p className="text-sm text-gray-500">
                  Ketuk tombol di bawah untuk memilih pegawai yang jadwalnya
                  ingin diatur.
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
          </>
        )}
      </section>

      <PegawaiPickerModal
        isOpen={pickerOpen}
        pegawai={daftarPegawai}
        sudahAdaJadwal={sudahAda}
        onPilih={pilihPegawai}
        onTutup={() => setPickerOpen(false)}
      />
    </>
  );
}