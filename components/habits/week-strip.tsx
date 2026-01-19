"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getWeekDates } from "@/lib/utils/streaks";

interface WeekStripProps {
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-6">
      <div className="flex items-center justify-between">
        {weekDates.map((date, index) => {
          const dateStr = date.toISOString().split("T")[0];
          const dayNum = date.getDate();
          const isToday = dateStr === today;
          const isSelected = dateStr === selected;
          const isPast = date < new Date(today);

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect?.(dateStr)}
              disabled={!onDateSelect}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-2 sm:px-3 rounded-xl transition-all",
                isSelected && "bg-primary/10",
                !isSelected && onDateSelect && "hover:bg-gray-50"
              )}
            >
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium uppercase tracking-wide",
                  isSelected
                    ? "text-primary"
                    : isPast
                    ? "text-gray-400"
                    : "text-gray-500"
                )}
              >
                {DAY_LABELS[index]}
              </span>
              <span
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all",
                  isToday && isSelected && "bg-primary text-white shadow-md",
                  isToday && !isSelected && "ring-2 ring-primary text-primary",
                  !isToday && isSelected && "bg-primary/20 text-primary",
                  !isToday && !isSelected && isPast && "text-gray-400",
                  !isToday && !isSelected && !isPast && "text-gray-700"
                )}
              >
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
