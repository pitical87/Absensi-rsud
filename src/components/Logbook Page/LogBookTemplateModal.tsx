import { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { LuPenLine } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";
import toast from "react-hot-toast";
import { addTemplate, deleteTemplate, getMyTemplate, updateTemplate } from "../../utils/api/LogBook";
import type { LogTemplate } from "../../types/LogBookType";
import Spinner from "../Spinner";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (isi: string) => void;
};

export default function LogBookTemplateModal({ open, onClose, onApply }: Props) {
  const [templates, setTemplates] = useState<LogTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState("");
  const [templateEditingId, setTemplateEditingId] = useState<number | null>(null);
  const [templateEditText, setTemplateEditText] = useState("");
  const [templateConfirmDeleteId, setTemplateConfirmDeleteId] = useState<number | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateUpdating, setTemplateUpdating] = useState(false);
  const [templateDeleting, setTemplateDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    getMyTemplate()
      .then((res) => {
        if (res.sukses) setTemplates(res.data);
      })
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, [open]);

  if (!open) return null;

  const loadTemplates = () => {
    setLoadingTemplates(true);
    getMyTemplate()
      .then((res) => {
        if (res.sukses) setTemplates(res.data);
      })
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
            <FiCopy />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">Template Logbook</h2>
            <p className="text-sm text-gray-500">Pilih template untuk mengisi baris form.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-600 transition hover:bg-gray-200">
            ×
          </button>
        </div>

        <form onSubmit={handleAddTemplate} className="mt-5 flex items-center gap-2">
          <input
            type="text"
            value={newTemplate}
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
                    <button onClick={() => onApply(t.isi)} className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">
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
  );
}