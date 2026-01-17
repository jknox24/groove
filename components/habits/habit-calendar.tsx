"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { HabitEntry } from "@/types";

interface HabitCalendarProps {
  entries: HabitEntry[];
  color: string;
  weeks?: number;
}

export function HabitCalendar({ entries, color, weeks = 12 }: HabitCalendarProps) {
  const { days, months } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a map of entries by date
    const entryMap = new Map(
      entries.map((e) => [e.entry_date, e])
    );

    // Generate days for the calendar (going back `weeks` weeks)
    const totalDays = weeks * 7;
    const days: { date: string; level: number; entry: HabitEntry | null }[] = [];

    // Find the start date (beginning of the week, `weeks` weeks ago)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    for (let i = 0; i < totalDays + startDate.getDay(); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const entry = entryMap.get(dateStr) ?? null;

      // Calculate intensity level (0-4)
      let level = 0;
      if (entry?.completed) {
        level = 4;
      } else if (entry?.value) {
        const value = Number(entry.value);
        if (value > 0) level = Math.min(4, Math.ceil(value / 2));
      }

      // Don't show future dates
      if (date > today) {
        days.push({ date: dateStr, level: -1, entry: null });
      } else {
        days.push({ date: dateStr, level, entry });
      }
    }

    // Calculate month labels
    const months: { label: string; offset: number }[] = [];
    let currentMonth = -1;

    days.forEach((day, index) => {
      const date = new Date(day.date);
      const month = date.getMonth();
      if (month !== currentMonth && index % 7 === 0) {
        currentMonth = month;
        months.push({
          label: date.toLocaleDateString("en-US", { month: "short" }),
          offset: Math.floor(index / 7),
        });
      }
    });

    return { days, months };
  }, [entries, weeks]);

  // Group days into weeks (columns)
  const weekColumns: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weekColumns.push(days.slice(i, i + 7));
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {months.map((month, i) => (
            <div
              key={i}
              className="text-xs text-text-muted"
              style={{
                marginLeft: i === 0 ? month.offset * 14 : (month.offset - (months[i - 1]?.offset ?? 0) - 1) * 14,
                width: 14,
              }}
            >
              {month.label}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col justify-around pr-2 text-xs text-text-muted">
            {dayLabels.filter((_, i) => i % 2 === 1).map((label) => (
              <span key={label} className="h-3 leading-3">{label}</span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-[3px]">
            {weekColumns.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <div
                    key={day.date}
                    className={cn(
                      "w-[11px] h-[11px] rounded-sm",
                      day.level === -1 && "bg-transparent",
                      day.level === 0 && "bg-border-subtle",
                      day.level >= 1 && "transition-colors"
                    )}
                    style={
                      day.level >= 1
                        ? {
                            backgroundColor: color,
                            opacity: 0.25 + (day.level / 4) * 0.75,
                          }
                        : undefined
                    }
                    title={`${day.date}${day.entry?.completed ? " - Completed" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-2 text-xs text-text-muted">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "w-[11px] h-[11px] rounded-sm",
                level === 0 && "bg-border-subtle"
              )}
              style={
                level > 0
                  ? {
                      backgroundColor: color,
                      opacity: 0.25 + (level / 4) * 0.75,
                    }
                  : undefined
              }
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
