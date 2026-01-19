"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const typeStyles: Record<ToastType, string> = {
  success: "bg-green-500 text-white",
  celebration: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  milestone: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
  info: "bg-gray-800 text-white",
};

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-50 pointer-events-none flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-300",
            typeStyles[toast.type]
          )}
        >
          {toast.emoji && <span className="text-2xl">{toast.emoji}</span>}
          <p className="font-medium text-sm">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
