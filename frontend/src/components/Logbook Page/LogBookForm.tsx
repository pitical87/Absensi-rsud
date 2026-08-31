import { useState } from "react";
import { useNavigate } from "react-router";
import { FiCopy } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import { IoArrowBack } from "react-icons/io5";
import { saveLogBulk } from "../../utils/api/LogBook";
import { newRow } from "../../utils/LogBookHelpers";
import type { LogEntry } from "../../types/LogBookType";
import toast from "react-hot-toast";
import Spinner from "../Spinner";
import LogBookTemplateModal from "./LogBookTemplateModal";

export default function LogBookForm({ onSaved }: { onSaved: () => void }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LogEntry[]>([newRow(1)]);
  const [saving, setSaving] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const addRow = () => setRows((p) => [...p, newRow(p.length ? Math.max(...p.map((r) => r.id)) + 1 : 1)]);
  const deleteRow = (id: number) => setRows((p) => p.filter((r) => r.id !== id));
  const updateRow = (id: number, field: Exclude<keyof LogEntry, "id">, value: string) => setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = rows.map(({ tanggal, jam, isi }) => ({ tanggal, jam, isi }));
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
    } catch {
      toast.error("Gagal mengirim log book. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (isi: string) => {
    setRows((prev) => {
      const firstEmpty = prev.find((r) => !r.isi.trim());
      if (firstEmpty) return prev.map((r) => (r.id === firstEmpty.id ? { ...r, isi } : r));
      const nextId = Math.max(...prev.map((r) => r.id)) + 1;
      return [...prev, { ...newRow(nextId), isi }];
    });
    setTemplateOpen(false);
    toast.success("Template diterapkan ke form.");
  };

  return (
    <section className="px-6 py-3 flex flex-col gap-3">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={addRow} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
            + Baris
          </button>
          <button type="button" onClick={() => setRows([newRow(1)])} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-95">
            Reset
          </button>
          <button type="button" onClick={() => setTemplateOpen(true)} className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 active:scale-95">
            <FiCopy />
            Template
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/")}
          title="Kembali"
          className="
    flex h-10 w-10 shrink-0 items-center justify-center
    rounded-2xl bg-gray-100 text-gray-600
    transition-all duration-200
    hover:bg-gray-200
    active:scale-95
  "
        >
          <IoArrowBack />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.id} className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-gray-300 hover:shadow-md">
            {/* Date & Time */}
            <div className="flex shrink-0 flex-col gap-2">
              <label className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Waktu</label>

              <input
                type="date"
                value={row.tanggal}
                onChange={(e) => updateRow(row.id, "tanggal", e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

              <input
                type="time"
                value={row.jam}
                onChange={(e) => updateRow(row.id, "jam", e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Activity */}
            <div className="flex flex-1 flex-col gap-2">
              <label className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Aktivitas</label>

              <textarea
                rows={3}
                placeholder="Tuliskan aktivitas yang kamu lakukan..."
                value={row.isi}
                onChange={(e) => updateRow(row.id, "isi", e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Delete */}
            {rows.length > 1 && (
              <button type="button" onClick={() => deleteRow(row.id)} className="rounded-xl p-2.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500" title="Hapus baris">
                <MdDeleteForever className="text-xl" />
              </button>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Spinner className="h-4 w-4" />
              Menyimpan...
            </>
          ) : (
            "Simpan Log Book"
          )}
        </button>
      </form>

      <LogBookTemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} onApply={applyTemplate} />
    </section>
  );
}