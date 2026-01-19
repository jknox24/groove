"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { HabitCheckIn } from "./habit-check-in";
import { PhotoUpload } from "./photo-upload";
import { checkInHabit, updateEntryPhoto } from "@/app/(dashboard)/actions";
import { formatStreak } from "@/lib/utils/streaks";
import type { Habit, HabitEntry } from "@/types";

interface DailyHabitListProps {
  habits: Habit[];
  entries: HabitEntry[];
  streaks?: Record<string, number>;
  date: string;
}

export function DailyHabitList({ habits, entries, streaks = {}, date }: DailyHabitListProps) {
  const entriesMap = new Map(entries.map((e) => [e.habit_id, e]));

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
      <div className="border border-border rounded-lg p-8 text-center">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
            <svg
              className="w-8 h-8 text-text-muted"
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
          <h2 className="text-lg font-semibold text-text mb-2">
            Create your first habit
          </h2>
          <p className="text-text-secondary text-sm mb-6">
            Start building better routines. Track what matters to you.
          </p>
          <Link
            href="/habits/new"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white rounded-md font-medium hover:bg-primary-light transition-colors"
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
      <p className="text-text-secondary mb-6">
        {completedCount === habits.length ? (
          <span className="text-primary font-medium">
            All {habits.length} habits completed! Great job!
          </span>
        ) : (
          <>
            {completedCount} of {habits.length} habits completed
          </>
        )}
      </p>

      {/* Habit List */}
      <div className="space-y-3">
        {habits.map((habit) => {
          const entry = entriesMap.get(habit.id) ?? null;
          const streak = streaks[habit.id] || 0;
          const streakText = formatStreak(streak);

          return (
            <div
              key={habit.id}
              className="flex items-center gap-4 p-4 rounded-2xl transition-all"
              style={{
                backgroundColor: habit.color || "#7c3aed",
                boxShadow: `0 4px 12px ${habit.color || "#7c3aed"}40`,
              }}
            >
              {/* Icon */}
              <Link
                href={`/habits/${habit.id}`}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 hover:scale-105 transition-transform bg-white/20"
              >
                {habit.icon}
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/habits/${habit.id}`}
                    className="font-semibold text-white hover:opacity-80 transition-opacity"
                  >
                    {habit.name}
                  </Link>
                  {/* Streak Badge */}
                  {streak > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                      <Flame className="w-3 h-3" />
                      {streakText}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/70">
                  {habit.tracking_type === "boolean" && "Tap to complete"}
                  {habit.tracking_type === "quantity" &&
                    `${entry?.value || 0}/${habit.target_value} ${habit.target_unit || ""}`}
                  {habit.tracking_type === "duration" &&
                    `${entry?.value || 0}/${habit.target_value} ${habit.target_unit || "min"}`}
                  {habit.tracking_type === "scale" &&
                    `Rate 1-${habit.target_value || 5}`}
                </p>
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
                onCheckIn={handleCheckIn}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
