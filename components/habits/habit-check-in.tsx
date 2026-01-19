"use client";

import { useState, useTransition } from "react";
import { Check, Minus, Plus } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import type { Habit, HabitEntry } from "@/types";

function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

interface HabitCheckInProps {
  habit: Habit;
  entry: HabitEntry | null;
  onCheckIn: (
    habitId: string,
    completed: boolean,
    value?: number
  ) => Promise<void>;
}

export function HabitCheckIn({ habit, entry, onCheckIn }: HabitCheckInProps) {
  const [isPending, startTransition] = useTransition();
  const [localValue, setLocalValue] = useState<number>(
    entry?.value ? Number(entry.value) : 0
  );
  const [showInput, setShowInput] = useState(false);

  const isCompleted = entry?.completed ?? false;
  const targetValue = habit.target_value ? Number(habit.target_value) : null;

  function handleBooleanToggle() {
    const willComplete = !isCompleted;
    startTransition(async () => {
      await onCheckIn(habit.id, willComplete);
      if (willComplete) triggerConfetti();
    });
  }

  function handleQuantityChange(delta: number) {
    const newValue = Math.max(0, localValue + delta);
    setLocalValue(newValue);

    startTransition(async () => {
      const wasCompleted = targetValue ? localValue >= targetValue : localValue > 0;
      const completed = targetValue ? newValue >= targetValue : newValue > 0;
      await onCheckIn(habit.id, completed, newValue);
      if (completed && !wasCompleted) triggerConfetti();
    });
  }

  function handleScaleSelect(value: number) {
    const wasCompleted = localValue > 0;
    setLocalValue(value);
    setShowInput(false);

    startTransition(async () => {
      await onCheckIn(habit.id, true, value);
      if (!wasCompleted) triggerConfetti();
    });
  }

  // Boolean tracking - simple checkbox (BIGGER for easy tapping)
  if (habit.tracking_type === "boolean") {
    return (
      <button
        onClick={handleBooleanToggle}
        disabled={isPending}
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
          "active:scale-90 hover:scale-105",
          isCompleted
            ? "bg-white text-green-600 shadow-lg"
            : "bg-white/20 hover:bg-white/30 text-white",
          isPending && "opacity-50"
        )}
      >
        {isCompleted ? (
          <Check className="w-6 h-6" strokeWidth={3} />
        ) : (
          <Plus className="w-6 h-6" strokeWidth={2} />
        )}
      </button>
    );
  }

  // Quantity tracking - stepper
  if (habit.tracking_type === "quantity") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleQuantityChange(-1)}
          disabled={isPending || localValue === 0}
          className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 disabled:opacity-30 text-white"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-10 h-8 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">
            {localValue}
          </span>
        </div>

        <button
          onClick={() => handleQuantityChange(1)}
          disabled={isPending}
          className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 disabled:opacity-30 text-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Duration tracking - minutes stepper
  if (habit.tracking_type === "duration") {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleQuantityChange(-5)}
          disabled={isPending || localValue === 0}
          className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 disabled:opacity-30 text-white"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-14 h-8 flex items-center justify-center">
          <span className="text-sm font-semibold text-white">
            {localValue}
            <span className="text-white/70 text-xs ml-0.5">
              {habit.target_unit || "min"}
            </span>
          </span>
        </div>

        <button
          onClick={() => handleQuantityChange(5)}
          disabled={isPending}
          className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 disabled:opacity-30 text-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Scale tracking - rating buttons
  if (habit.tracking_type === "scale") {
    const maxScale = targetValue || 5;
    const scales = Array.from({ length: maxScale }, (_, i) => i + 1);

    if (!showInput && localValue > 0) {
      return (
        <button
          onClick={() => setShowInput(true)}
          className="w-10 h-10 rounded-lg bg-white text-gray-800 font-semibold shadow-lg"
        >
          {localValue}
        </button>
      );
    }

    return (
      <div className="flex gap-1">
        {scales.map((value) => (
          <button
            key={value}
            onClick={() => handleScaleSelect(value)}
            disabled={isPending}
            className={cn(
              "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
              localValue === value
                ? "bg-white text-gray-800 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            )}
          >
            {value}
          </button>
        ))}
      </div>
    );
  }

  return null;
}
