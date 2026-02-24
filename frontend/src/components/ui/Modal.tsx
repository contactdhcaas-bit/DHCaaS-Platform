// frontend/src/components/ui/Modal.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type ModalVariant = "default" | "danger";

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ensureModalRoot(): HTMLElement {
  const existing = document.getElementById("modal-root");
  if (existing) return existing;

  const el = document.createElement("div");
  el.id = "modal-root";
  document.body.appendChild(el);
  return el;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const root = ensureModalRoot();

  const confirmBtnClasses =
    variant === "danger"
      ? "bg-danger-500 hover:bg-danger-500/90"
      : "bg-brand-500 hover:bg-brand-500/90";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-glow animate-fade-in"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-700">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-gray-400">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${confirmBtnClasses}`}
          >
            {loading ? "Working..." : confirmText}
          </button>
        </div>
      </div>
    </div>,
    root
  );
};
