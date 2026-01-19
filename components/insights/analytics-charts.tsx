"use client";

import { cn } from "@/lib/utils";

interface DayData {
  date: string;
  completed: number;
  total: number;
}

interface WeeklyTrendProps {
  data: { week: string; rate: number }[];
}

export function WeeklyTrendChart({ data }: WeeklyTrendProps) {
  const maxRate = Math.max(...data.map((d) => d.rate), 1);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Weekly Completion Trend
      </h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((week, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center justify-end h-24">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {week.rate}%
              </span>
              <div
                className="w-full max-w-[40px] bg-primary rounded-t-lg transition-all duration-500"
                style={{
                  height: `${(week.rate / maxRate) * 80}%`,
                  minHeight: week.rate > 0 ? "8px" : "0",
                }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {week.week}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DayOfWeekProps {
  data: { day: string; rate: number; shortDay: string }[];
}

export function DayOfWeekChart({ data }: DayOfWeekProps) {
  const maxRate = Math.max(...data.map((d) => d.rate), 1);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Performance by Day
      </h3>
      <div className="space-y-2">
        {data.map((day, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8">
              {day.shortDay}
            </span>
            <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  day.rate >= 80
                    ? "bg-green-500"
                    : day.rate >= 50
                      ? "bg-primary"
                      : day.rate >= 25
                        ? "bg-amber-500"
                        : "bg-gray-300 dark:bg-gray-600"
                )}
                style={{ width: `${(day.rate / maxRate) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
              {day.rate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HeatmapProps {
  data: DayData[];
  weeks?: number;
}

export function CompletionHeatmap({ data, weeks = 12 }: HeatmapProps) {
  // Create a map for quick lookup
  const dateMap = new Map(data.map((d) => [d.date, d]));

  // Generate last N weeks of dates
  const today = new Date();
  const days: { date: string; rate: number; dayOfWeek: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayData = dateMap.get(dateStr);
    const rate = dayData && dayData.total > 0 ? (dayData.completed / dayData.total) * 100 : 0;

    days.push({
      date: dateStr,
      rate,
      dayOfWeek: date.getDay(),
    });
  }

  // Group by week
  const weekGroups: typeof days[] = [];
  let currentWeek: typeof days = [];

  days.forEach((day, i) => {
    currentWeek.push(day);
    if (day.dayOfWeek === 6 || i === days.length - 1) {
      weekGroups.push(currentWeek);
      currentWeek = [];
    }
  });

  const getColor = (rate: number) => {
    if (rate === 0) return "bg-gray-100 dark:bg-gray-800";
    if (rate < 25) return "bg-green-200 dark:bg-green-900";
    if (rate < 50) return "bg-green-300 dark:bg-green-700";
    if (rate < 75) return "bg-green-400 dark:bg-green-600";
    return "bg-green-500 dark:bg-green-500";
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Activity Heatmap (Last {weeks} Weeks)
      </h3>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-fit">
          {/* Day labels */}
          <div className="flex flex-col gap-1 text-xs text-gray-400 pr-1">
            <span className="h-3"></span>
            <span className="h-3">M</span>
            <span className="h-3"></span>
            <span className="h-3">W</span>
            <span className="h-3"></span>
            <span className="h-3">F</span>
            <span className="h-3"></span>
          </div>

          {weekGroups.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                const day = week.find((d) => d.dayOfWeek === dayIndex);
                return (
                  <div
                    key={dayIndex}
                    className={cn(
                      "w-3 h-3 rounded-sm transition-colors",
                      day ? getColor(day.rate) : "bg-transparent"
                    )}
                    title={day ? `${day.date}: ${Math.round(day.rate)}%` : ""}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

interface TimeOfDayProps {
  data: { hour: string; rate: number }[];
}

export function TimeOfDayChart({ data }: TimeOfDayProps) {
  const maxRate = Math.max(...data.map((d) => d.rate), 1);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Best Time to Complete Habits
      </h3>
      <div className="flex items-end gap-1 h-20">
        {data.map((slot, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={cn(
                "w-full rounded-t transition-all duration-300",
                slot.rate > 0 ? "bg-primary/70" : "bg-gray-200 dark:bg-gray-700"
              )}
              style={{
                height: `${(slot.rate / maxRate) * 100}%`,
                minHeight: "4px",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>12am</span>
      </div>
    </div>
  );
}
