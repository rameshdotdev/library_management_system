"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";

export type ToastMessage = {
  id: number;
  message: string;
  type: "success" | "error";
};

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, type: ToastMessage["type"]) {
    setToast({ id: Date.now(), message, type });
  }

  return { toast, showToast, dismissToast: () => setToast(null) };
}

export function ToastViewport({
  toast,
  onDismiss,
}: {
  toast: ToastMessage | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;
  const isError = toast.type === "error";
  const Icon = isError ? AlertCircle : Check;

  return (
    <div className="fixed bottom-4 right-4 z-80 w-[min(24rem,calc(100vw-2rem))]">
      <div
        key={toast.id}
        role={isError ? "alert" : "status"}
        className={`flex items-start gap-3 rounded-lg border bg-card p-3.5 text-sm text-card-foreground shadow-lg ${isError ? "border-destructive/40" : "border-primary/30"}`}
      >
        <Icon
          aria-hidden="true"
          className={`mt-0.5 shrink-0 ${isError ? "text-destructive" : "text-primary"}`}
          size={17}
        />
        <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={onDismiss}
          className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
