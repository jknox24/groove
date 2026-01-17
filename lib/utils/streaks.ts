import type { HabitEntry } from "@/types";

interface StreakResult {
  currentStreak: number;
  bestStreak: number;
  completionRate7Days: number;
  completionRate30Days: number;
  completionRateAllTime: number;
  totalCompleted: number;
  totalDays: number;
}

export function calculateStreaks(entries: HabitEntry[]): StreakResult {
  if (entries.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      completionRate7Days: 0,
      completionRate30Days: 0,
      completionRateAllTime: 0,
      totalCompleted: 0,
      totalDays: 0,
    };
  }

  // Sort entries by date descending
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  const completedEntries = sortedEntries.filter((e) => e.completed);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate current streak
  let currentStreak = 0;
  const completedDates = new Set(completedEntries.map((e) => e.entry_date));

  for (let i = 0; i <= 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (completedDates.has(dateStr)) {
      currentStreak++;
    } else if (i > 0) {
      // Allow today to be incomplete, but break on any other gap
      break;
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  // Sort ascending for best streak calculation
  const ascendingEntries = [...completedEntries].sort(
    (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );

  for (const entry of ascendingEntries) {
    const entryDate = new Date(entry.entry_date);

    if (lastDate === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round(
        (entryDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    lastDate = entryDate;
  }

  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  // Calculate completion rates
  const last7Days = new Set<string>();
  const last30Days = new Set<string>();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    if (i < 7) last7Days.add(dateStr);
    last30Days.add(dateStr);
  }

  const completed7Days = completedEntries.filter((e) =>
    last7Days.has(e.entry_date)
  ).length;
  const completed30Days = completedEntries.filter((e) =>
    last30Days.has(e.entry_date)
  ).length;

  return {
    currentStreak,
    bestStreak,
    completionRate7Days: Math.round((completed7Days / 7) * 100),
    completionRate30Days: Math.round((completed30Days / 30) * 100),
    completionRateAllTime:
      entries.length > 0
        ? Math.round((completedEntries.length / entries.length) * 100)
        : 0,
    totalCompleted: completedEntries.length,
    totalDays: entries.length,
  };
}
