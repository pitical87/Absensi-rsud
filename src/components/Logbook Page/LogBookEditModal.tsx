import { LuPenLine } from "react-icons/lu";
import Spinner from "../Spinner";

type EditForm = {
  tanggal: string;
  jam: string;
  isi: string;
};

type Props = {
  open: boolean;
  form: EditForm;
  saving: boolean;
  onField: (field: keyof EditForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
};

export default function LogBookEditModal({ open, form, saving, onField, onSubmit, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
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
                value={form.tanggal}
                onChange={(e) => onField("tanggal", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Jam</label>
              <input
                type="time"
                value={form.jam}
                onChange={(e) => onField("jam", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Aktivitas</label>
            <textarea
              rows={3}
              value={form.isi}
              onChange={(e) => onField("isi", e.target.value)}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
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
  );
}