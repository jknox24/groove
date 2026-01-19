"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { HabitCheckIn } from "./habit-check-in";
import { MiniCalendar } from "./mini-calendar";
import { PhotoUpload } from "./photo-upload";
import { checkInHabit, updateEntryPhoto } from "@/app/(dashboard)/actions";
import type { Habit, HabitEntry } from "@/types";

interface DailyHabitListProps {
  habits: Habit[];
  entries: HabitEntry[];
  allEntries?: HabitEntry[]; // All entries for mini calendar
  streaks?: Record<string, number>;
  date: string;
}

export function DailyHabitList({
  habits,
  entries,
  allEntries = [],
  streaks = {},
  date,
}: DailyHabitListProps) {
  const entriesMap = new Map(entries.map((e) => [e.habit_id, e]));

  // Group all entries by habit for mini calendar
  const entriesByHabit = new Map<string, HabitEntry[]>();
  allEntries.forEach((entry) => {
    const existing = entriesByHabit.get(entry.habit_id) || [];
    entriesByHabit.set(entry.habit_id, [...existing, entry]);
  });

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

  // Calculate stats
  const completedCount = habits.filter((h) => {
    const entry = entriesMap.get(h.id);
    return entry?.completed;
  }).length;

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-500 text-sm">
          {completedCount === habits.length ? (
            <span className="text-green-600 font-medium">
              All done! Great job!
            </span>
          ) : (
            <>
              {completedCount} of {habits.length} completed
            </>
          )}
        </p>
      </div>

      {/* Habit List */}
      <div className="space-y-3">
        {habits.map((habit) => {
          const entry = entriesMap.get(habit.id) ?? null;
          const streak = streaks[habit.id] || 0;
          const habitEntries = entriesByHabit.get(habit.id) || [];
          const habitColor = habit.color || "#7c3aed";

          return (
            <div
              key={habit.id}
              className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
            >
              {/* Color accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: habitColor }}
              />

              <div className="flex items-center gap-4 pl-2">
                {/* Icon */}
                <Link
                  href={`/habits/${habit.id}`}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${habitColor}15` }}
                >
                  {habit.icon || "✨"}
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/habits/${habit.id}`}
                      className="font-semibold text-gray-900 hover:text-primary transition-colors truncate"
                    >
                      {habit.name}
                    </Link>
                    {/* Streak Badge */}
                    {streak > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-medium shrink-0">
                        <Flame className="w-3 h-3" />
                        {streak}
                      </span>
                    )}
                  </div>

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
          );
        })}
      </div>
    </div>
  );
}
