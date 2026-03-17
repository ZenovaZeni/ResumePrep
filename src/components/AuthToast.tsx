"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type Kind = "success" | "error" | "info";

export function AuthToast({
  message,
  kind,
  onDismiss,
  autoHideMs = 8000,
}: {
  message: string;
  kind: Kind;
  onDismiss: () => void;
  autoHideMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onDismiss]);

  const bg = kind === "success" ? "bg-emerald-600" : kind === "error" ? "bg-red-600" : "bg-[var(--accent)]";
  const icon = kind === "success" ? "✓" : kind === "error" ? "!" : "i";

  const toastEl = (
    <div
      role="alert"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] ${bg} text-white px-6 py-4 rounded-[var(--radius-lg)] shadow-2xl flex items-center gap-3 min-w-[320px] max-w-[90vw] ring-2 ring-white/20`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
        {icon}
      </span>
      <p className="flex-1 font-medium text-sm leading-snug">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );

  if (typeof document === "undefined") return toastEl;
  return createPortal(toastEl, document.body);
}
