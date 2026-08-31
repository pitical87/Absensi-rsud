import { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { LuPenLine } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";
import { RiFileHistoryLine } from "react-icons/ri";
import { deleteLogBook, getLogBooks, updateLogBook } from "../../utils/api/LogBook";
import { formatTanggal } from "../../utils/LogBookHelpers";
import type { LogbookEntry } from "../../types/LogBookType";
import toast from "react-hot-toast";
import ConfirmModal from "../ConfirmModal";
import LogBookEditModal from "./LogBookEditModal";

export default function LogBookRiwayat({ refreshKey }: { refreshKey: number }) {
  const [query, setQuery] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ tanggal: "", jam: "", isi: "" });
  const [updating, setUpdating] = useState(false);

  const refresh = () => {
    setEntriesLoading(true);
    getLogBooks({ q: query || undefined, bulan, tahun })
      .then((res) => {
        if (res.sukses) setEntries(res.data);
      })
      .catch(() => {})
      .finally(() => setEntriesLoading(false));
  };

  useEffect(() => {
    getLogBooks({ q: query || undefined, bulan, tahun })
      .then((res) => {
        if (res.sukses) setEntries(res.data);
      })
      .catch(() => {})
      .finally(() => setEntriesLoading(false));
  }, [query, bulan, tahun, refreshKey]);

  const startEdit = (entry: LogbookEntry) => {
    setEditingId(entry.id);
    setEditForm({ tanggal: entry.tanggal, jam: entry.jam, isi: entry.isi });
  };

  const updateEditField = (field: "tanggal" | "jam" | "isi", value: string) => setEditForm((f) => ({ ...f, [field]: value }));

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId === null) return;
    setUpdating(true);
    try {
      const res = await updateLogBook({ id: editingId, ...editForm });
      if (res.sukses) {
        toast.success(res.pesan ?? "Catatan berhasil diperbarui.");
        setEditingId(null);
        refresh();
      } else {
        toast.error(res.pesan ?? "Gagal memperbarui catatan.");
      }
    } catch {
      toast.error("Gagal memperbarui catatan. Silakan coba lagi.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteLogBook(id);
      if (res.sukses) {
        toast.success(res.pesan ?? "Catatan telah dihapus.");
        refresh();
      } else {
        toast.error(res.pesan ?? "Gagal menghapus catatan.");
      }
    } catch {
      toast.error("Gagal menghapus catatan. Silakan coba lagi.");
    }
  };

  return (
    <section className="px-6 py-3 flex flex-col gap-3">
      <LogBookEditModal
        open={editingId !== null}
        form={editForm}
        saving={updating}
        onField={updateEditField}
        onSubmit={handleUpdate}
        onCancel={() => setEditingId(null)}
      />

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Hapus Catatan?"
        message="Catatan ini akan dihapus dan tidak dapat dikembalikan."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onConfirm={() => {
          if (confirmDeleteId !== null) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <h1 className="flex items-center gap-2 text-lg font-bold text-gray-800">
        <RiFileHistoryLine />
        Riwayat Logbook
      </h1>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <BiSearch className="text-gray-400" />
          <input type="text" placeholder="Cari kegiatan..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
        </div>

        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i, 1).toLocaleDateString("id-ID", { month: "long" })}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {entriesLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Belum ada catatan logbook.</p>
      ) : (
        <ul className="flex flex-col gap-3 max-h-70 overflow-y-scroll">
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-500">{formatTanggal(e.tanggal)}</span>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${e.is_verified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {e.jam} · {e.is_verified ? "Terverifikasi" : "Belum verifikasi"}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-800">{e.isi}</p>
              <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-2">
                <button type="button" onClick={() => startEdit(e)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
                  <LuPenLine className="text-sm" />
                  Edit
                </button>
                <button type="button" onClick={() => setConfirmDeleteId(e.id)} className="flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50">
                  <MdDeleteForever className="text-sm" />
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}