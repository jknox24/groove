"use client";

import { useState, useTransition } from "react";
import { Eye, Shield } from "lucide-react";
import { shareHabitWithPartner, unshareHabit } from "../actions";
import type { Habit } from "@/types";

interface HabitShareToggleProps {
  habit: Habit;
  partnershipId: string;
  isShared: boolean;
  canVerify: boolean;
}

export function HabitShareToggle({
  habit,
  partnershipId,
  isShared: initialIsShared,
  canVerify: initialCanVerify,
}: HabitShareToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [isShared, setIsShared] = useState(initialIsShared);
  const [canVerify, setCanVerify] = useState(initialCanVerify);

  function handleToggleShare() {
    const newIsShared = !isShared;
    setIsShared(newIsShared);

    startTransition(async () => {
      if (newIsShared) {
        await shareHabitWithPartner(habit.id, partnershipId, false);
      } else {
        await unshareHabit(habit.id, partnershipId);
        setCanVerify(false);
      }
    });
  }

  function handleToggleVerify() {
    if (!isShared) return;

    const newCanVerify = !canVerify;
    setCanVerify(newCanVerify);

    startTransition(async () => {
      await shareHabitWithPartner(habit.id, partnershipId, newCanVerify);
    });
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
        isShared ? "border-primary/30 bg-primary/5" : "border-border"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {/* Habit Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: `${habit.color}15` }}
      >
        {habit.icon}
      </div>

      {/* Habit Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{habit.name}</p>
        <p className="text-xs text-text-muted">
          {isShared
            ? canVerify
              ? "Shared with verification"
              : "Shared (view only)"
            : "Not shared"}
        </p>
      </div>

      {/* Toggle Buttons */}
      <div className="flex items-center gap-2">
        {/* Can Verify Toggle (only show if shared) */}
        {isShared && (
          <button
            onClick={handleToggleVerify}
            disabled={isPending}
            className={`p-2 rounded-md transition-colors ${
              canVerify
                ? "bg-primary text-white"
                : "bg-background text-text-muted hover:text-text"
            }`}
            title={canVerify ? "Can verify your entries" : "View only"}
          >
            <Shield className="w-4 h-4" />
          </button>
        )}

        {/* Share Toggle */}
        <button
          onClick={handleToggleShare}
          disabled={isPending}
          className={`p-2 rounded-md transition-colors ${
            isShared
              ? "bg-primary text-white"
              : "bg-background text-text-muted hover:text-text"
          }`}
          title={isShared ? "Stop sharing" : "Share this habit"}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
