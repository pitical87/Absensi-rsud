import { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { FiX } from "react-icons/fi";
import { LuPenLine } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";
import { RiFileHistoryLine } from "react-icons/ri";
import {
  deleteLogBook,
  getLogBooks,
  updateLogBook,
} from "../../utils/api/LogBook";
import { formatTanggal } from "../../utils/LogBookHelpers";
import type { LogbookEntry } from "../../types/LogBookType";
import toast from "react-hot-toast";
import ConfirmModal from "../ConfirmModal";
import LogBookEditModal from "./LogBookEditModal";
import Skeleton, { CardListSkeleton } from "../Skeleton";

type Props = {
  open: boolean;
  refreshKey: number;
  onClose: () => void;
};

export default function LogBookRiwayat({ open, refreshKey, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(open);
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
    if (!open) return;
    let cancelled = false;
    getLogBooks({ q: query || undefined, bulan, tahun })
      .then((res) => {
        if (!cancelled && res.sukses) setEntries(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setEntriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, query, bulan, tahun, refreshKey]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId === null && confirmDeleteId === null) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, editingId, confirmDeleteId, onClose]);

  const startEdit = (entry: LogbookEntry) => {
    setEditingId(entry.id);
    setEditForm({ tanggal: entry.tanggal, jam: entry.jam, isi: entry.isi });
  };

  const updateEditField = (field: "tanggal" | "jam" | "isi", value: string) =>
    setEditForm((f) => ({ ...f, [field]: value }));

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

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="riwayat-logbook-title"
        onClick={onClose}>
        <div
          className="flex max-h-[86vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}>
          {/* Header Modal */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-lg text-blue-600">
                <RiFileHistoryLine />
              </div>
              <div>
                <h2
                  id="riwayat-logbook-title"
                  className="text-base font-semibold text-gray-900">
                  Riwayat Logbook
                </h2>
                {entriesLoading ? (
                  <Skeleton className="mt-1 h-3 w-28 rounded" />
                ) : (
                  <p className="text-xs text-gray-500">
                    {entries.length} catatan ditemukan
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup riwayat"
              className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
              <FiX size={20} />
            </button>
          </div>

          {/* Filter */}
          <div className="space-y-2.5 border-b border-gray-100 px-5 py-3.5">
            <div className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <BiSearch className="shrink-0 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kegiatan..."
                value={query}
                onChange={(e) => {
                  setEntriesLoading(true);
                  setQuery(e.target.value);
                }}
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={bulan}
                onChange={(e) => {
                  setEntriesLoading(true);
                  setBulan(Number(e.target.value));
                }}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i, 1).toLocaleDateString("id-ID", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={tahun}
                min={2020}
                max={2099}
                onChange={(e) => {
                  setEntriesLoading(true);
                  setTahun(Number(e.target.value));
                }}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Daftar Riwayat */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {entriesLoading ? (
              <CardListSkeleton count={3} />
            ) : entries.length === 0 ? (
              <p className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
                Belum ada catatan logbook.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        {formatTanggal(e.tanggal)}
                      </span>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          e.is_verified
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                        {e.jam} ·{" "}
                        <span>
                          {e.is_verified ? "Terverifikasi" : "Belum verifikasi"}
                        </span>
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-800 whitespace-pre-line">
                      {e.isi}
                    </p>
                    {!e.is_verified && (
                      <div className="mt-3 flex justify-end gap-2 border-t border-gray-200/70 pt-2.5">
                        <button
                          type="button"
                          onClick={() => startEdit(e)}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100">
                          <LuPenLine className="text-sm" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(e.id)}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50">
                          <MdDeleteForever className="text-sm" />
                          Hapus
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              Tutup
            </button>
          </div>
        </div>
      </div>

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
    </>
  );
}
