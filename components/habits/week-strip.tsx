"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getWeekDates } from "@/lib/utils/streaks";

interface WeekStripProps {
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function WeekStrip({ selectedDate, onDateSelect }: WeekStripProps) {
  const { weekDates, today } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().split("T")[0];
    return {
      weekDates: getWeekDates(now),
      today: todayStr,
    };
  }, []);

  const selected = selectedDate || today;

  return (
    <div className="flex items-center justify-between px-2 py-3 bg-surface rounded-xl border border-border mb-6">
      {weekDates.map((date, index) => {
        const dateStr = date.toISOString().split("T")[0];
        const dayNum = date.getDate();
        const isToday = dateStr === today;
        const isSelected = dateStr === selected;

        return (
          <button
            key={dateStr}
            onClick={() => onDateSelect?.(dateStr)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all",
              isSelected && "bg-primary/10",
              !isSelected && "hover:bg-background"
            )}
          >
            <span className={cn(
              "text-xs font-medium",
              isSelected ? "text-primary" : "text-text-muted"
            )}>
              {DAY_LABELS[index]}
            </span>
            <span
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all",
                isToday && isSelected && "bg-primary text-white",
                isToday && !isSelected && "ring-2 ring-primary text-primary",
                !isToday && isSelected && "bg-primary/20 text-primary",
                !isToday && !isSelected && "text-text"
              )}
            >
              {dayNum}
            </span>
          </button>
        );
      })}
    </div>
  );
}
