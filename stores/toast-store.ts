import { create } from "zustand";

export type ToastType = "success" | "celebration" | "milestone" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  emoji?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    const duration = toast.duration ?? 4000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Helper functions
export function showCelebration(message: string, emoji = "🎉") {
  useToastStore.getState().addToast({
    type: "celebration",
    message,
    emoji,
    duration: 5000,
  });
}

export function showMilestone(streak: number) {
  const messages: Record<number, { message: string; emoji: string }> = {
    7: { message: "1 week streak! Amazing consistency!", emoji: "🔥" },
    14: { message: "2 weeks strong! You're unstoppable!", emoji: "💪" },
    21: { message: "3 weeks! Habits are forming!", emoji: "⭐" },
    30: { message: "30 days! You're a habit master!", emoji: "🏆" },
    50: { message: "50 day streak! Incredible!", emoji: "🚀" },
    100: { message: "100 DAYS! You're legendary!", emoji: "👑" },
  };

  const milestone = messages[streak];
  if (milestone) {
    useToastStore.getState().addToast({
      type: "milestone",
      message: milestone.message,
      emoji: milestone.emoji,
      duration: 6000,
    });
  }
}
