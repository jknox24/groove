"use client";

import Link from "next/link";
import { HabitCheckIn } from "./habit-check-in";
import { PhotoUpload } from "./photo-upload";
import { checkInHabit, updateEntryPhoto } from "@/app/(dashboard)/actions";
import type { Habit, HabitEntry } from "@/types";

interface DailyHabitListProps {
  habits: Habit[];
  entries: HabitEntry[];
  date: string;
}

export function DailyHabitList({ habits, entries, date }: DailyHabitListProps) {
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

          return (
            <div
              key={habit.id}
              className="flex items-center gap-4 p-4 border border-border rounded-lg bg-surface"
            >
              {/* Icon */}
              <Link
                href={`/habits/${habit.id}`}
                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 hover:scale-105 transition-transform"
                style={{ backgroundColor: `${habit.color}15` }}
              >
                {habit.icon}
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/habits/${habit.id}`}
                  className="font-medium text-text hover:text-primary transition-colors"
                >
                  {habit.name}
                </Link>
                <p className="text-sm text-text-muted">
                  {habit.tracking_type === "boolean" && "Tap to complete"}
                  {habit.tracking_type === "quantity" &&
                    `Target: ${habit.target_value} ${habit.target_unit || ""}`}
                  {habit.tracking_type === "duration" &&
                    `Target: ${habit.target_value} ${habit.target_unit || "min"}`}
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
