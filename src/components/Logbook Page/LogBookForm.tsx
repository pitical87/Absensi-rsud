import { useState } from "react";
import { FaRegCheckCircle } from "react-icons/fa";
import { FiCopy, FiPlus, FiRotateCcw } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import { saveLogBulk } from "../../utils/api/LogBook";
import { newRow } from "../../utils/LogBookHelpers";
import type { LogEntry } from "../../types/LogBookType";
import toast from "react-hot-toast";
import Spinner from "../Spinner";
import LogBookTemplateModal from "./LogBookTemplateModal";

export default function LogBookForm({ onSaved }: { onSaved: () => void }) {
  const [rows, setRows] = useState<LogEntry[]>([newRow(1)]);
  const [saving, setSaving] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const addRow = () =>
    setRows((p) => [
      ...p,
      newRow(p.length ? Math.max(...p.map((r) => r.id)) + 1 : 1),
    ]);
  const deleteRow = (id: number) =>
    setRows((p) => p.filter((r) => r.id !== id));
  const updateRow = (
    id: number,
    field: Exclude<keyof LogEntry, "id">,
    value: string,
  ) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = rows.map(({ tanggal, jam, isi }) => ({
      tanggal,
      jam,
      isi,
    }));
    setSaving(true);
    try {
      const res = await saveLogBulk({ entri: payload });
      if (res.sukses) {
        toast.success(res.pesan ?? "Log book berhasil dikirim.");
        setRows([newRow(1)]);
        onSaved();
      } else {
        toast.error(res.pesan ?? "Gagal mengirim log book.");
      }
    } catch (err: unknown) {
      const pesan = (err as { response?: { data?: { pesan?: string } } })
        ?.response?.data?.pesan;
      toast.error(pesan || "Gagal mengirim log book. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (isi: string) => {
    setRows((prev) => {
      const firstEmpty = prev.find((r) => !r.isi.trim());
      if (firstEmpty)
        return prev.map((r) => (r.id === firstEmpty.id ? { ...r, isi } : r));
      const nextId = Math.max(...prev.map((r) => r.id)) + 1;
      return [...prev, { ...newRow(nextId), isi }];
    });
    setTemplateOpen(false);
    toast.success("Template diterapkan ke form.");
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
              <FiPlus className="text-sm" />
              <span>Tambah</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 active:scale-95">
              <FiCopy className="text-sm" />
              <span>Template</span>
            </button>
          </div>

          <button
            type="button"
            aria-label="Reset form"
            onClick={() => setRows([newRow(1)])}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 active:scale-95">
            <FiRotateCcw className="text-sm" />
            <span>Reset</span>
          </button>
        </div>

        {/* Baris Entri */}
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
              {/* Waktu (Tanggal & Jam di atas) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={row.tanggal}
                    onChange={(e) =>
                      updateRow(row.id, "tanggal", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Jam
                  </label>
                  <input
                    type="time"
                    value={row.jam}
                    onChange={(e) => updateRow(row.id, "jam", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Aktivitas di bawah (lebar penuh) */}
              <div className="flex flex-col">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Aktivitas
                  </label>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                      title="Hapus baris">
                      <MdDeleteForever className="text-base" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="Tuliskan aktivitas yang kamu lakukan..."
                  value={row.isi}
                  onChange={(e) => updateRow(row.id, "isi", e.target.value)}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500">
          {saving ? (
            <>
              <Spinner className="h-4 w-4" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <FaRegCheckCircle className="text-lg" />
              <span>Simpan Logbook</span>
            </>
          )}
        </button>
      </form>

      <LogBookTemplateModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onApply={applyTemplate}
      />
    </>
  );
}
