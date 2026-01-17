"use client";

import { useState, useTransition } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit, HabitEntry } from "@/types";

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
    startTransition(async () => {
      await onCheckIn(habit.id, !isCompleted);
    });
  }

  function handleQuantityChange(delta: number) {
    const newValue = Math.max(0, localValue + delta);
    setLocalValue(newValue);

    startTransition(async () => {
      const completed = targetValue ? newValue >= targetValue : newValue > 0;
      await onCheckIn(habit.id, completed, newValue);
    });
  }

  function handleScaleSelect(value: number) {
    setLocalValue(value);
    setShowInput(false);

    startTransition(async () => {
      await onCheckIn(habit.id, true, value);
    });
  }

  // Boolean tracking - simple checkbox
  if (habit.tracking_type === "boolean") {
    return (
      <button
        onClick={handleBooleanToggle}
        disabled={isPending}
        className={cn(
          "w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all",
          "active:scale-95",
          isCompleted
            ? "bg-primary border-primary text-white"
            : "border-border hover:border-primary/50",
          isPending && "opacity-50"
        )}
      >
        {isCompleted && <Check className="w-5 h-5" />}
      </button>
    );
  }

  // Quantity tracking - stepper
  if (habit.tracking_type === "quantity") {
    const progress = targetValue ? Math.min(100, (localValue / targetValue) * 100) : 0;

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(-1)}
          disabled={isPending || localValue === 0}
          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-background disabled:opacity-30"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="relative w-16 h-10 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-md bg-primary/10"
            style={{ width: `${progress}%` }}
          />
          <span className="relative text-sm font-medium">
            {localValue}
            {targetValue && (
              <span className="text-text-muted">/{targetValue}</span>
            )}
          </span>
        </div>

        <button
          onClick={() => handleQuantityChange(1)}
          disabled={isPending}
          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-background disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Duration tracking - minutes stepper
  if (habit.tracking_type === "duration") {
    const progress = targetValue ? Math.min(100, (localValue / targetValue) * 100) : 0;

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(-5)}
          disabled={isPending || localValue === 0}
          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-background disabled:opacity-30"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="relative w-20 h-10 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-md bg-primary/10"
            style={{ width: `${progress}%` }}
          />
          <span className="relative text-sm font-medium">
            {localValue}
            <span className="text-text-muted text-xs ml-0.5">
              {habit.target_unit || "min"}
            </span>
          </span>
        </div>

        <button
          onClick={() => handleQuantityChange(5)}
          disabled={isPending}
          className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-background disabled:opacity-30"
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
          className="w-10 h-10 rounded-lg bg-primary text-white font-medium"
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
              "w-8 h-8 rounded-md text-sm font-medium transition-colors",
              localValue === value
                ? "bg-primary text-white"
                : "border border-border hover:border-primary/50"
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
