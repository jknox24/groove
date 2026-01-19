"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Flame, CornerDownRight, Star } from "lucide-react";
import { HabitCheckIn } from "./habit-check-in";
import { MiniCalendar } from "./mini-calendar";
import { PhotoUpload } from "./photo-upload";
import { HabitFilter, getCurrentTimeOfDay } from "./habit-filter";
import { checkInHabit, updateEntryPhoto } from "@/app/(dashboard)/actions";
import { toggleHabitFocus } from "@/app/(dashboard)/habits/actions";
import { cn } from "@/lib/utils";
import type { Habit, HabitEntry, TimeOfDay } from "@/types";

interface DailyHabitListProps {
  habits: Habit[];
  entries: HabitEntry[];
  allEntries?: HabitEntry[]; // All entries for mini calendar
  streaks?: Record<string, number>;
  date: string;
}

// Organize habits into groups based on stacking relationships
function organizeHabits(habits: Habit[]): { habit: Habit; isStacked: boolean; cueHabit?: Habit }[] {
  const habitsMap = new Map(habits.map(h => [h.id, h]));
  const result: { habit: Habit; isStacked: boolean; cueHabit?: Habit }[] = [];
  const processed = new Set<string>();

  // First, add standalone habits (not stacked after anything)
  habits.forEach(habit => {
    if (!habit.cue_habit_id && !processed.has(habit.id)) {
      result.push({ habit, isStacked: false });
      processed.add(habit.id);

      // Find habits stacked after this one
      habits
        .filter(h => h.cue_habit_id === habit.id)
        .forEach(stackedHabit => {
          if (!processed.has(stackedHabit.id)) {
            result.push({
              habit: stackedHabit,
              isStacked: true,
              cueHabit: habit,
            });
            processed.add(stackedHabit.id);
          }
        });
    }
  });

  // Add any remaining habits (orphaned stacked habits whose cue habit isn't shown today)
  habits.forEach(habit => {
    if (!processed.has(habit.id)) {
      const cueHabit = habit.cue_habit_id ? habitsMap.get(habit.cue_habit_id) : undefined;
      result.push({
        habit,
        isStacked: !!habit.cue_habit_id,
        cueHabit,
      });
      processed.add(habit.id);
    }
  });

  return result;
}

type StatusFilter = "all" | "unmet" | "met";

export function DailyHabitList({
  habits,
  entries,
  allEntries = [],
  streaks = {},
  date,
}: DailyHabitListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeOfDay | "all" | "now">("all");

  const entriesMap = useMemo(
    () => new Map(entries.map((e) => [e.habit_id, e])),
    [entries]
  );

  // Filter habits based on selected filters
  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      // Status filter
      if (statusFilter !== "all") {
        const entry = entriesMap.get(habit.id);
        const isCompleted = entry?.completed ?? false;
        if (statusFilter === "met" && !isCompleted) return false;
        if (statusFilter === "unmet" && isCompleted) return false;
      }

      // Time filter
      if (timeFilter !== "all") {
        const habitTime = habit.time_of_day || "anytime";
        if (timeFilter === "now") {
          const currentTime = getCurrentTimeOfDay();
          // Show habits for current time + anytime habits
          if (habitTime !== currentTime && habitTime !== "anytime") return false;
        } else if (timeFilter !== "anytime") {
          // Show habits for selected time + anytime habits
          if (habitTime !== timeFilter && habitTime !== "anytime") return false;
        }
      }

      return true;
    });
  }, [habits, statusFilter, timeFilter, entriesMap]);

  const handleFilterChange = (status: StatusFilter, time: TimeOfDay | "all" | "now") => {
    setStatusFilter(status);
    setTimeFilter(time);
  };

  // Group all entries by habit for mini calendar
  const entriesByHabit = new Map<string, HabitEntry[]>();
  allEntries.forEach((entry) => {
    const existing = entriesByHabit.get(entry.habit_id) || [];
    entriesByHabit.set(entry.habit_id, [...existing, entry]);
  });

  // Organize habits for stacking display (using filtered habits)
  // Put focus habits first
  const sortedHabits = [...filteredHabits].sort((a, b) => {
    if (a.is_focus && !b.is_focus) return -1;
    if (!a.is_focus && b.is_focus) return 1;
    return 0;
  });
  const organizedHabits = organizeHabits(sortedHabits);

  const focusHabits = filteredHabits.filter(h => h.is_focus);

  async function handleCheckIn(
    habitId: string,
    completed: boolean,
    value?: number
  ) {
    await checkInHabit(habitId, completed, value, date);
  }

  async function handlePhotoUploaded(habitId: string, photoUrl: string | null) {
    await updateEntryPhoto(habitId, date, photoUrl);
  }

  if (habits.length === 0) {
    return (
      <div className="border border-border rounded-2xl p-8 text-center bg-white">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Create your first habit
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Start building better routines. Track what matters to you.
          </p>
          <Link
            href="/habits/new"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Add Habit
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats (always based on all habits, not filtered)
  const completedCount = habits.filter((h) => {
    const entry = entriesMap.get(h.id);
    return entry?.completed;
  }).length;

  // Stats for filtered view
  const filteredCompletedCount = filteredHabits.filter((h) => {
    const entry = entriesMap.get(h.id);
    return entry?.completed;
  }).length;

  return (
    <div>
      {/* Filter */}
      {habits.length > 0 && (
        <div className="mb-4">
          <HabitFilter onFilterChange={handleFilterChange} />
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-sm">
          {completedCount === habits.length ? (
            <span className="text-green-600 font-medium">
              All done! Great job!
            </span>
          ) : statusFilter !== "all" || timeFilter !== "all" ? (
            <>
              Showing {filteredHabits.length} of {habits.length} habits
              {filteredCompletedCount > 0 && ` (${filteredCompletedCount} done)`}
            </>
          ) : (
            <>
              {completedCount} of {habits.length} completed
            </>
          )}
        </p>
      </div>

      {/* Empty filter state */}
      {filteredHabits.length === 0 && habits.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No habits match your filters</p>
          <button
            onClick={() => handleFilterChange("all", "all")}
            className="text-primary text-sm mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Focus Section Header */}
      {focusHabits.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Today&apos;s Focus
          </span>
          <div className="flex-1 h-px bg-amber-200 dark:bg-amber-800" />
        </div>
      )}

      {/* Habit List */}
      <div className="space-y-3">
        {organizedHabits.map(({ habit, isStacked, cueHabit }, index) => {
          const isFirstNonFocus = index === focusHabits.length && focusHabits.length > 0;
          const showOtherHabitsHeader = isFirstNonFocus && !isStacked;
          const entry = entriesMap.get(habit.id) ?? null;
          const streak = streaks[habit.id] || 0;
          const habitEntries = entriesByHabit.get(habit.id) || [];
          const habitColor = habit.color || "#7c3aed";

          return (
            <div key={habit.id}>
              {/* Other Habits Header */}
              {showOtherHabitsHeader && (
                <div className="flex items-center gap-2 mb-3 mt-6">
                  <span className="text-sm font-medium text-gray-500">
                    Other Habits
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
              )}
              <div
                className={cn(
                  "relative bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border overflow-hidden transition-all hover:shadow-md",
                  isStacked && "ml-6 border-l-2",
                  habit.is_focus
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
                    : "border-gray-100 dark:border-gray-800"
                )}
                style={isStacked ? { borderLeftColor: habitColor } : undefined}
              >
              {/* Color accent bar (only for non-stacked) */}
              {!isStacked && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: habitColor }}
                />
              )}

              {/* Stacking indicator */}
              {isStacked && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-gray-400">
                  <CornerDownRight className="w-4 h-4" />
                </div>
              )}

              <div className="flex items-center gap-4 pl-2">
                {/* Icon */}
                <Link
                  href={`/habits/${habit.id}`}
                  className={cn(
                    "rounded-xl flex items-center justify-center shrink-0 hover:scale-105 transition-transform",
                    isStacked ? "w-10 h-10 text-xl" : "w-12 h-12 text-2xl"
                  )}
                  style={{ backgroundColor: `${habitColor}15` }}
                >
                  {habit.icon || "✨"}
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/habits/${habit.id}`}
                      className={cn(
                        "font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors truncate",
                        isStacked && "text-sm"
                      )}
                    >
                      {habit.name}
                    </Link>
                    {/* Streak Badge */}
                    {streak > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-medium shrink-0">
                        <Flame className="w-3 h-3" />
                        {streak}
                      </span>
                    )}
                    {/* Focus Toggle */}
                    <button
                      onClick={() => toggleHabitFocus(habit.id, !habit.is_focus)}
                      className={cn(
                        "p-1 rounded transition-colors shrink-0",
                        habit.is_focus
                          ? "text-amber-500"
                          : "text-gray-300 hover:text-amber-400"
                      )}
                      title={habit.is_focus ? "Remove from focus" : "Add to focus"}
                    >
                      <Star
                        className="w-4 h-4"
                        fill={habit.is_focus ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  {/* Stacking label */}
                  {isStacked && cueHabit && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {habit.cue_type === "after" && `after ${cueHabit.icon} ${cueHabit.name}`}
                      {habit.cue_type === "before" && `before ${cueHabit.icon} ${cueHabit.name}`}
                      {habit.cue_type === "with" && `with ${cueHabit.icon} ${cueHabit.name}`}
                    </p>
                  )}

                  {/* Mini calendar - last 7 days */}
                  <MiniCalendar entries={habitEntries} color={habitColor} />
                </div>

                {/* Photo Upload (for photo verification type) */}
                {habit.verification_type === "photo" && (
                  <PhotoUpload
                    habitId={habit.id}
                    entryDate={date}
                    currentPhotoUrl={entry?.photo_url}
                    onPhotoUploaded={(url) => handlePhotoUploaded(habit.id, url)}
                  />
                )}

                {/* Check-in Control */}
                <HabitCheckIn
                  habit={habit}
                  entry={entry}
                  streak={streak}
                  onCheckIn={handleCheckIn}
                />
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
