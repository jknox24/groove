"use client";

import { useState, useTransition } from "react";
import { Check, Minus, Plus } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import {
  playCompletionSound,
  playMilestoneSound,
  isStreakMilestone,
  getMilestoneMessage,
} from "@/lib/sounds";
import { showMilestone, showCelebration } from "@/stores/toast-store";
import type { Habit, HabitEntry } from "@/types";

function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899"],
  });
}

function triggerMilestoneConfetti() {
  // Big celebration for milestones
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#f59e0b", "#ef4444", "#ec4899"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#f59e0b", "#ef4444", "#ec4899"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}

interface HabitCheckInProps {
  habit: Habit;
  entry: HabitEntry | null;
  streak?: number;
  onCheckIn: (
    habitId: string,
    completed: boolean,
    value?: number
  ) => Promise<void>;
}

export function HabitCheckIn({
  habit,
  entry,
  streak = 0,
  onCheckIn,
}: HabitCheckInProps) {
  const [isPending, startTransition] = useTransition();
  const [localValue, setLocalValue] = useState<number>(
    entry?.value ? Number(entry.value) : 0
  );
  const [showInput, setShowInput] = useState(false);

  const isCompleted = entry?.completed ?? false;
  const targetValue = habit.target_value ? Number(habit.target_value) : null;
  const habitColor = habit.color || "#7c3aed";

  function handleCompletion(newStreak: number, habitName: string) {
    playCompletionSound();
    triggerConfetti();

    // Show basic completion toast for smaller streaks
    if (newStreak === 3) {
      showCelebration(`3 day streak on ${habitName}! Keep going!`, "🔥");
    } else if (newStreak === 5) {
      showCelebration(`5 days of ${habitName}! You're on fire!`, "💪");
    }

    // Check for milestone (7, 14, 21, 30, 50, 100)
    if (isStreakMilestone(newStreak)) {
      setTimeout(() => {
        playMilestoneSound();
        triggerMilestoneConfetti();
        showMilestone(newStreak);
      }, 300);
    }
  }

  function handleBooleanToggle() {
    const willComplete = !isCompleted;
    startTransition(async () => {
      await onCheckIn(habit.id, willComplete);
      if (willComplete) {
        handleCompletion(streak + 1, habit.name);
      }
    });
  }

  function handleQuantityChange(delta: number) {
    const newValue = Math.max(0, localValue + delta);
    setLocalValue(newValue);

    startTransition(async () => {
      const wasCompleted = targetValue
        ? localValue >= targetValue
        : localValue > 0;
      const completed = targetValue ? newValue >= targetValue : newValue > 0;
      await onCheckIn(habit.id, completed, newValue);
      if (completed && !wasCompleted) {
        handleCompletion(streak + 1, habit.name);
      }
    });
  }

  function handleScaleSelect(value: number) {
    const wasCompleted = localValue > 0;
    setLocalValue(value);
    setShowInput(false);

    startTransition(async () => {
      await onCheckIn(habit.id, true, value);
      if (!wasCompleted) {
        handleCompletion(streak + 1, habit.name);
      }
    });
  }

  // Boolean tracking - large tap target
  if (habit.tracking_type === "boolean") {
    return (
      <button
        onClick={handleBooleanToggle}
        disabled={isPending}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
          "active:scale-90 hover:scale-105",
          isPending && "opacity-50"
        )}
        style={{
          backgroundColor: isCompleted ? habitColor : `${habitColor}15`,
          color: isCompleted ? "white" : habitColor,
        }}
      >
        {isCompleted ? (
          <Check className="w-7 h-7" strokeWidth={3} />
        ) : (
          <Plus className="w-6 h-6" strokeWidth={2} />
        )}
      </button>
    );
  }

  // Quantity tracking - stepper
  if (habit.tracking_type === "quantity") {
    const isComplete = targetValue ? localValue >= targetValue : localValue > 0;

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleQuantityChange(-1)}
          disabled={isPending || localValue === 0}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 text-gray-600"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div
          className={cn(
            "w-12 h-10 flex items-center justify-center rounded-lg font-semibold text-sm",
            isComplete ? "text-white" : "text-gray-700"
          )}
          style={{
            backgroundColor: isComplete ? habitColor : `${habitColor}15`,
          }}
        >
          {localValue}
        </div>

        <button
          onClick={() => handleQuantityChange(1)}
          disabled={isPending}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 text-gray-600"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Duration tracking - minutes stepper
  if (habit.tracking_type === "duration") {
    const isComplete = targetValue ? localValue >= targetValue : localValue > 0;

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleQuantityChange(-5)}
          disabled={isPending || localValue === 0}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 text-gray-600"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div
          className={cn(
            "min-w-[3.5rem] h-10 px-2 flex items-center justify-center rounded-lg font-semibold text-sm",
            isComplete ? "text-white" : "text-gray-700"
          )}
          style={{
            backgroundColor: isComplete ? habitColor : `${habitColor}15`,
          }}
        >
          {localValue}
          <span className="text-xs ml-0.5 opacity-70">
            {habit.target_unit || "m"}
          </span>
        </div>

        <button
          onClick={() => handleQuantityChange(5)}
          disabled={isPending}
          className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-30 text-gray-600"
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
          className="w-12 h-12 rounded-xl font-bold text-lg text-white"
          style={{ backgroundColor: habitColor }}
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
              "w-9 h-9 rounded-lg text-sm font-semibold transition-colors",
              localValue === value ? "text-white" : "text-gray-600"
            )}
            style={{
              backgroundColor:
                localValue === value ? habitColor : `${habitColor}15`,
            }}
          >
            {value}
          </button>
        ))}
      </div>
    );
  }

  return null;
}
