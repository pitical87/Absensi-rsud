import { FaQuestion } from "react-icons/fa";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Ya",
  cancelLabel = "Tidak",
  onConfirm,
  onCancel,
}: Props) {
  if (!isOpen) return null;

  return (
    // Overlay backdrop
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onCancel}>
      {/* Modal card */}
      <div
        className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}>
        {/* Icon / Title */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <FaQuestion className="text-red-500 text-xl" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500 text-center">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-white font-medium hover:bg-red-700 transition">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
