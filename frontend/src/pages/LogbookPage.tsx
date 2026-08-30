import { useEffect, useState } from "react";
import TopNavbar from "../components/Client Page/TopNavbar";
import { MdDeleteForever } from "react-icons/md";
import { deleteLogBook, getLogBooks, saveLogBulk, updateLogBook, addTemplate, deleteTemplate, getMyTemplate, updateTemplate } from "../utils/api/LogBook";
import toast from "react-hot-toast";
import type { LogbookEntry, LogTemplate } from "../types/LogBookType";
import { BiSearch } from "react-icons/bi";
import { RiFileHistoryLine } from "react-icons/ri";
import { LuPenLine } from "react-icons/lu";
import { FiCopy } from "react-icons/fi";
import ConfirmModal from "../components/ConfirmModal";

type LogEntry = {
  id: number;
  tanggal: string;
  jam: string;
  isi: string;
};

const newRow = (id: number): LogEntry => ({
  id,
  tanggal: new Date().toLocaleDateString("sv-SE"),
  jam: "",
  isi: "",
});

const formatTanggal = (tanggal: string) => {
  const [y, m, d] = tanggal.split("-").map(Number);
  if (!y || !m || !d) return tanggal;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
};

function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function LogbookPage() {
  const [rows, setRows] = useState<LogEntry[]>([newRow(1)]);
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [query, setQuery] = useState("");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ tanggal: "", jam: "", isi: "" });
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templates, setTemplates] = useState<LogTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState("");
  const [templateEditingId, setTemplateEditingId] = useState<number | null>(null);
  const [templateEditText, setTemplateEditText] = useState("");
  const [templateConfirmDeleteId, setTemplateConfirmDeleteId] = useState<number | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateUpdating, setTemplateUpdating] = useState(false);
  const [templateDeleting, setTemplateDeleting] = useState(false);

  const addRow = () => setRows((p) => [...p, newRow(p.length ? Math.max(...p.map((r) => r.id)) + 1 : 1)]);
  const deleteRow = (id: number) => setRows((p) => p.filter((r) => r.id !== id));
  const updateRow = (id: number, field: Exclude<keyof LogEntry, "id">, value: string) => setRows((p) => p.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

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
  }, [query, bulan, tahun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = rows.map(({ tanggal, jam, isi }) => ({ tanggal, jam, isi }));
    setSaving(true);
    try {
      const res = await saveLogBulk({ entri: payload });
      if (res.sukses) {
        toast.success(res.pesan ?? "Log book berhasil dikirim.");
        setRows([newRow(1)]);
        refresh();
      } else {
        toast.error(res.pesan ?? "Gagal mengirim log book.");
      }
    } catch {
      toast.error("Gagal mengirim log book. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry: LogbookEntry) => {
    setEditingId(entry.id);
    setEditForm({ tanggal: entry.tanggal, jam: entry.jam, isi: entry.isi });
  };

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

  const loadTemplates = () => {
    setLoadingTemplates(true);
    getMyTemplate()
      .then((res) => {
        if (res.sukses) setTemplates(res.data);
      })
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  };

  const openTemplateModal = () => {
    setTemplateOpen(true);
    loadTemplates();
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

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplate.trim()) return;
    setTemplateSaving(true);
    addTemplate({ isi: newTemplate })
      .then((res) => {
        if (res.sukses) {
          toast.success(res.pesan ?? "Template berhasil ditambahkan.");
          setNewTemplate("");
          loadTemplates();
        } else {
          toast.error(res.pesan ?? "Gagal menambahkan template.");
        }
      })
      .catch((error) => {
        console.log(error.response.data);
        toast.error("Gagal menambahkan template. Silakan coba lagi.");
      })
      .finally(() => setTemplateSaving(false));
  };

  const startTemplateEdit = (t: LogTemplate) => {
    setTemplateEditingId(t.id);
    setTemplateEditText(t.isi);
  };

  const handleSaveTemplateEdit = (id: number) => {
    if (!templateEditText.trim()) return;
    setTemplateUpdating(true);
    updateTemplate({ id, isi: templateEditText })
      .then((res) => {
        if (res.sukses) {
          toast.success(res.pesan ?? "Template berhasil diperbarui.");
          setTemplateEditingId(null);
          loadTemplates();
        } else {
          toast.error(res.pesan ?? "Gagal memperbarui template.");
        }
      })
      .catch(() => toast.error("Gagal memperbarui template. Silakan coba lagi."))
      .finally(() => setTemplateUpdating(false));
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplateDeleting(true);
    deleteTemplate(id)
      .then((res) => {
        if (res.sukses) {
          toast.success(res.pesan ?? "Template telah dihapus.");
          setTemplateConfirmDeleteId(null);
          loadTemplates();
        } else {
          toast.error(res.pesan ?? "Gagal menghapus template.");
        }
      })
      .catch(() => toast.error("Gagal menghapus template. Silakan coba lagi."))
      .finally(() => setTemplateDeleting(false));
  };

  return (
    <div>
      <TopNavbar />
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
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setEditingId(null)}>
          <form onSubmit={handleUpdate} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
                <LuPenLine />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Edit Catatan</h2>
                <p className="text-sm text-gray-500">Perbarui detail kegiatan.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Tanggal</label>
                  <input
                    type="date"
                    value={editForm.tanggal}
                    onChange={(e) => setEditForm({ ...editForm, tanggal: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">Jam</label>
                  <input
                    type="time"
                    value={editForm.jam}
                    onChange={(e) => setEditForm({ ...editForm, jam: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">Aktivitas</label>
                <textarea
                  rows={3}
                  value={editForm.isi}
                  onChange={(e) => setEditForm({ ...editForm, isi: e.target.value })}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setEditingId(null)} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                Batal
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {templateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setTemplateOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
                <FiCopy />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-800">Template Logbook</h2>
                <p className="text-sm text-gray-500">Pilih template untuk mengisi baris form.</p>
              </div>
              <button type="button" onClick={() => setTemplateOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-600 transition hover:bg-gray-200">
                ×
              </button>
            </div>

            <form onSubmit={handleAddTemplate} className="mt-5 flex items-center gap-2">
              <input
                type="text"
                value={newTemplate}
                // name="isi"
                onChange={(e) => setNewTemplate(e.target.value)}
                placeholder="Tulis template kegiatan baru..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={templateSaving}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {templateSaving ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Menambah...
                  </>
                ) : (
                  "Tambah"
                )}
              </button>
            </form>

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
              {loadingTemplates ? (
                <p className="py-6 text-center text-sm text-gray-400">Memuat template...</p>
              ) : templates.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">Belum ada template.</p>
              ) : (
                templates.map((t) => (
                  <div key={t.id} className="rounded-xl border border-gray-200 bg-white p-3">
                    {templateEditingId === t.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={templateEditText}
                          onChange={(e) => setTemplateEditText(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          onClick={() => handleSaveTemplateEdit(t.id)}
                          disabled={templateUpdating}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {templateUpdating ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button onClick={() => setTemplateEditingId(null)} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
                          Batal
                        </button>
                      </div>
                    ) : templateConfirmDeleteId === t.id ? (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-700">Hapus template ini?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteTemplate(t.id)}
                            disabled={templateDeleting}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {templateDeleting ? "Menghapus..." : "Ya, Hapus"}
                          </button>
                          <button onClick={() => setTemplateConfirmDeleteId(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm text-gray-800">{t.isi}</p>
                        <button onClick={() => applyTemplate(t.isi)} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">
                          Pakai
                        </button>
                        <button onClick={() => startTemplateEdit(t)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50">
                          <LuPenLine className="text-sm" />
                          Edit
                        </button>
                        <button onClick={() => setTemplateConfirmDeleteId(t.id)} className="flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50">
                          <MdDeleteForever className="text-sm" />
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <section className="px-6 py-3 flex flex-col gap-3">
        {/* Action Bar */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={addRow} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95">
            + Baris
          </button>
          <button type="button" onClick={() => setRows([newRow(1)])} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-95">
            Reset
          </button>
          <button type="button" onClick={openTemplateModal} className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 active:scale-95">
            <FiCopy />
            Template
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
      </section>

      {/* Riwayat */}
      <section className="px-6 py-3 flex flex-col gap-3 overflow-y-scroll">
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
          <ul className="flex flex-col gap-3">
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
    </div>
  );
}
