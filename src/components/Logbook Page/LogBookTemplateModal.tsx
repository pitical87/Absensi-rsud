import { useEffect, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { LuCheck, LuPenLine, LuX } from "react-icons/lu";
import { MdDeleteForever } from "react-icons/md";
import toast from "react-hot-toast";
import {
  addTemplate,
  deleteTemplate,
  getMyTemplate,
  updateTemplate,
} from "../../utils/api/LogBook";
import type { LogTemplate } from "../../types/LogBookType";
import Spinner from "../Spinner";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (isi: string) => void;
};

const TOOLTIP =
  "pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 sm:block";

export default function LogBookTemplateModal({
  open,
  onClose,
  onApply,
}: Props) {
  const [templates, setTemplates] = useState<LogTemplate[]>([]);
  const [newTemplate, setNewTemplate] = useState("");
  const [templateEditingId, setTemplateEditingId] = useState<number | null>(
    null,
  );
  const [templateEditText, setTemplateEditText] = useState("");
  const [templateConfirmDeleteId, setTemplateConfirmDeleteId] = useState<
    number | null
  >(null);
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
      .catch(() =>
        toast.error("Gagal memperbarui template. Silakan coba lagi."),
      )
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white p-4 shadow-xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg text-blue-600 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-xl">
            <FiCopy />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-gray-800 sm:text-lg">
              Template Logbook
            </h2>
            <p className="text-xs text-gray-500 sm:text-sm">
              Pilih template untuk mengisi baris form.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-600 transition hover:bg-gray-200">
            ×
          </button>
        </div>

        {/* Form tambah */}
        <form
          onSubmit={handleAddTemplate}
          className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newTemplate}
            onChange={(e) => setNewTemplate(e.target.value)}
            placeholder="Template kegiatan baru..."
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={templateSaving}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4">
            {templateSaving ? (
              <>
                <Spinner className="h-4 w-4" />
                <span className="hidden sm:inline">Menambah...</span>
              </>
            ) : (
              "Tambah"
            )}
          </button>
        </form>

        {/* Daftar */}
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto sm:mt-4">
          {loadingTemplates ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Memuat template...
            </p>
          ) : templates.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              Belum ada template.
            </p>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-gray-200 bg-white p-3">
                {templateEditingId === t.id ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="text"
                      value={templateEditText}
                      onChange={(e) => setTemplateEditText(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <div className="group relative shrink-0">
                      <button
                        type="button"
                        aria-label="Simpan"
                        onClick={() => handleSaveTemplateEdit(t.id)}
                        disabled={templateUpdating}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {templateUpdating ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <LuCheck className="text-base" />
                        )}
                      </button>
                      <span className={TOOLTIP}>
                        {templateUpdating ? "Menyimpan..." : "Simpan"}
                      </span>
                    </div>

                    <div className="group relative shrink-0">
                      <button
                        type="button"
                        aria-label="Batal"
                        onClick={() => setTemplateEditingId(null)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50">
                        <LuX className="text-base" />
                      </button>
                      <span className={TOOLTIP}>Batal</span>
                    </div>
                  </div>
                ) : templateConfirmDeleteId === t.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700">Hapus template ini?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteTemplate(t.id)}
                        disabled={templateDeleting}
                        className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none">
                        {templateDeleting ? "Menghapus..." : "Ya, Hapus"}
                      </button>
                      <button
                        onClick={() => setTemplateConfirmDeleteId(null)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 sm:flex-none">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 sm:items-center sm:gap-2">
                    <p className="min-w-0 flex-1 break-words text-sm text-gray-800">
                      {t.isi}
                    </p>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                      <div className="group relative">
                        <button
                          type="button"
                          aria-label="Pakai"
                          onClick={() => onApply(t.isi)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100">
                          <LuCheck className="text-base" />
                        </button>
                        <span className={TOOLTIP}>Pakai</span>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => startTemplateEdit(t)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50">
                          <LuPenLine className="text-base" />
                        </button>
                        <span className={TOOLTIP}>Edit</span>
                      </div>

                      <div className="group relative">
                        <button
                          type="button"
                          aria-label="Hapus"
                          onClick={() => setTemplateConfirmDeleteId(t.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50">
                          <MdDeleteForever className="text-base" />
                        </button>
                        <span className={TOOLTIP}>Hapus</span>
                      </div>
                    </div>
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
