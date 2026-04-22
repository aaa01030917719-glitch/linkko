"use client";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pt-3 pb-8">
          <h2 className="text-base font-bold text-gray-900 mb-1.5">{title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">{message}</p>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-2xl bg-gray-100 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-2xl py-3.5 text-sm font-semibold transition ${
                destructive
                  ? "bg-red-500 text-white hover:bg-red-600 active:bg-red-700"
                  : "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-md shadow-primary-500/25"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
