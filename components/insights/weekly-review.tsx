"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Flame,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit, HabitEntry } from "@/types";

interface WeeklyReviewProps {
  habits: Habit[];
  entries: HabitEntry[];
  prevWeekEntries: HabitEntry[];
  weekStart: string;
  weekEnd: string;
}

export function WeeklyReview({
  habits,
  entries,
  prevWeekEntries,
  weekStart,
  weekEnd,
}: WeeklyReviewProps) {
  const stats = useMemo(() => {
    // Calculate completion rate for this week
    const totalPossible = habits.length * 7;
    const completedThisWeek = entries.filter((e) => e.completed).length;
    const completionRate = totalPossible > 0
      ? Math.round((completedThisWeek / totalPossible) * 100)
      : 0;

    // Calculate previous week rate
    const completedPrevWeek = prevWeekEntries.filter((e) => e.completed).length;
    const prevCompletionRate = totalPossible > 0
      ? Math.round((completedPrevWeek / totalPossible) * 100)
      : 0;

    const rateChange = completionRate - prevCompletionRate;

    // Per-habit stats
    const habitStats = habits.map((habit) => {
      const habitEntries = entries.filter((e) => e.habit_id === habit.id);
      const completed = habitEntries.filter((e) => e.completed).length;
      const prevHabitEntries = prevWeekEntries.filter((e) => e.habit_id === habit.id);
      const prevCompleted = prevHabitEntries.filter((e) => e.completed).length;

      return {
        habit,
        completed,
        total: 7,
        rate: Math.round((completed / 7) * 100),
        prevRate: Math.round((prevCompleted / 7) * 100),
        change: completed - prevCompleted,
      };
    });

    // Find best and worst performers
    const sorted = [...habitStats].sort((a, b) => b.rate - a.rate);
    const bestHabit = sorted[0];
    const needsWork = sorted.filter((h) => h.rate < 50);

    // Perfect days (all habits completed)
    const dayCompletions: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.completed) {
        dayCompletions[e.entry_date] = (dayCompletions[e.entry_date] || 0) + 1;
      }
    });
    const perfectDays = Object.values(dayCompletions).filter(
      (count) => count === habits.length && habits.length > 0
    ).length;

    // Longest streak this week
    const days = getDaysOfWeek(weekStart);
    let currentStreak = 0;
    let longestStreak = 0;
    days.forEach((day) => {
      const dayComplete = (dayCompletions[day] || 0) === habits.length && habits.length > 0;
      if (dayComplete) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return {
      completionRate,
      prevCompletionRate,
      rateChange,
      completedThisWeek,
      totalPossible,
      habitStats,
      bestHabit,
      needsWork,
      perfectDays,
      longestStreak,
    };
  }, [habits, entries, prevWeekEntries, weekStart]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No habits to review
        </h2>
        <p className="text-gray-500 mb-6">
          Create some habits first to see your weekly review.
        </p>
        <Link
          href="/habits/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg"
        >
          Create Habit
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Weekly Review
          </h1>
          <p className="text-gray-500">
            {formatDate(weekStart)} - {formatDate(weekEnd)}
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Completion Rate */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-5 h-5 text-primary" />
            {stats.rateChange !== 0 && (
              <span
                className={cn(
                  "text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded-full",
                  stats.rateChange > 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {stats.rateChange > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(stats.rateChange)}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.completionRate}%
          </p>
          <p className="text-sm text-gray-500">Completion rate</p>
        </div>

        {/* Perfect Days */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <Trophy className="w-5 h-5 text-yellow-500 mb-3" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.perfectDays}
          </p>
          <p className="text-sm text-gray-500">Perfect days</p>
        </div>

        {/* Check-ins */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <Calendar className="w-5 h-5 text-blue-500 mb-3" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.completedThisWeek}
          </p>
          <p className="text-sm text-gray-500">
            of {stats.totalPossible} check-ins
          </p>
        </div>

        {/* Streak */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <Flame className="w-5 h-5 text-orange-500 mb-3" />
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.longestStreak}
          </p>
          <p className="text-sm text-gray-500">Day streak</p>
        </div>
      </div>

      {/* Best Performer */}
      {stats.bestHabit && stats.bestHabit.rate > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-5 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{
                backgroundColor: `${stats.bestHabit.habit.color}20`,
              }}
            >
              {stats.bestHabit.habit.icon || "✨"}
            </div>
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-0.5">
                Best this week
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {stats.bestHabit.habit.name}
              </p>
              <p className="text-sm text-gray-500">
                {stats.bestHabit.completed}/7 days ({stats.bestHabit.rate}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Habits Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Habit Breakdown
        </h2>
        <div className="space-y-3">
          {stats.habitStats.map(({ habit, completed, rate, change }) => (
            <div
              key={habit.id}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: `${habit.color}20` }}
                >
                  {habit.icon || "✨"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {completed}/7
                      </span>
                      {change !== 0 && (
                        <span
                          className={cn(
                            "flex items-center text-xs",
                            change > 0 ? "text-green-600" : "text-red-500"
                          )}
                        >
                          {change > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                      {change === 0 && (
                        <Minus className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rate}%`,
                        backgroundColor: habit.color || "#7c3aed",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Needs Work Section */}
      {stats.needsWork.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">
            Needs attention
          </h3>
          <ul className="space-y-2">
            {stats.needsWork.map(({ habit, rate }) => (
              <li
                key={habit.id}
                className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300"
              >
                <span>{habit.icon || "✨"}</span>
                <span>{habit.name}</span>
                <span className="text-amber-500">({rate}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Motivational Message */}
      <div className="text-center py-4">
        <p className="text-gray-500">
          {stats.completionRate >= 80
            ? "Amazing week! Keep up the momentum! 🚀"
            : stats.completionRate >= 50
            ? "Good progress! Let's make next week even better! 💪"
            : "Every step counts. You've got this! 🌱"}
        </p>
      </div>
    </div>
  );
}

// Helper to get all days of the week
function getDaysOfWeek(weekStart: string): string[] {
  const days: string[] = [];
  const start = new Date(weekStart + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day.toISOString().split("T")[0]);
  }
  return days;
}
