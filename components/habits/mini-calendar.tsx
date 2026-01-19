"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { HabitEntry } from "@/types";

interface MiniCalendarProps {
  entries: HabitEntry[];
  color?: string;
}

/**
 * Shows last 7 days as small dots indicating completion status
 */
export function MiniCalendar({ entries, color = "#22c55e" }: MiniCalendarProps) {
  const { days, completedDates } = useMemo(() => {
    const completedDates = new Set(
      entries.filter((e) => e.completed).map((e) => e.entry_date)
    );

    // Get last 7 days
    const days: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split("T")[0]);
    }

    return { days, completedDates };
  }, [entries]);

  return (
    <div className="flex items-center gap-1">
      {days.map((date, index) => {
        const isCompleted = completedDates.has(date);
        const isToday = index === 6;

        return (
          <div
            key={date}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isCompleted ? "" : "bg-gray-200",
              isToday && !isCompleted && "ring-1 ring-gray-300"
            )}
            style={isCompleted ? { backgroundColor: color } : undefined}
            title={`${date}${isCompleted ? " - Completed" : ""}`}
          />
        );
      })}
    </div>
  );
}
