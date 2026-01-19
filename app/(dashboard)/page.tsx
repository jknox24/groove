import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { DailyHabitList } from "@/components/habits/daily-habit-list";
import { WeekStrip } from "@/components/habits/week-strip";
import { NudgeBanner } from "@/components/partners/nudge-banner";
import { calculateStreaks } from "@/lib/utils/streaks";
import type { Habit, HabitEntry } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get today's date in user's timezone (simplified - using UTC for now)
  const today = new Date().toISOString().split("T")[0];

  // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = new Date().getDay();

  // Fetch habits
  const { data: allHabits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user?.id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  // Filter habits that should show today
  const habits = (allHabits ?? []).filter((habit: Habit) => {
    if (habit.frequency === "daily") return true;
    if (habit.frequency === "weekly") return true; // Show weekly habits every day
    if (habit.frequency === "specific_days" && habit.frequency_days) {
      return habit.frequency_days.includes(dayOfWeek);
    }
    return true;
  });

  // Fetch today's entries
  const { data: entries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", user?.id)
    .eq("entry_date", today);

  // Fetch all entries for streak calculation (last 365 days)
  const { data: allEntries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", user?.id)
    .gte("entry_date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  // Calculate streaks for each habit
  const streakMap = new Map<string, number>();
  habits.forEach((habit: Habit) => {
    const habitEntries = (allEntries ?? []).filter((e: HabitEntry) => e.habit_id === habit.id);
    const streakData = calculateStreaks(habitEntries);
    streakMap.set(habit.id, streakData.currentStreak);
  });

  // Fetch unread nudges
  const { data: nudges } = await supabase
    .from("nudges")
    .select(`
      id,
      message,
      created_at,
      from_user:profiles!nudges_from_user_id_fkey(
        id,
        display_name,
        username
      )
    `)
    .eq("to_user_id", user?.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  // Type the nudges properly
  const typedNudges = (nudges ?? []).map(n => {
    const fromUser = Array.isArray(n.from_user) ? n.from_user[0] : n.from_user;
    return {
      id: n.id,
      message: n.message,
      created_at: n.created_at,
      from_user: fromUser as { id: string; display_name: string | null; username: string | null },
    };
  });

  // Convert streakMap to object for client component
  const streaks: Record<string, number> = {};
  streakMap.forEach((value, key) => {
    streaks[key] = value;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Nudge Banner */}
      <NudgeBanner nudges={typedNudges} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text">Today</h1>
        {habits.length > 0 && (
          <Link href="/habits/new">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </Link>
        )}
      </div>

      {/* Week Calendar Strip */}
      <WeekStrip selectedDate={today} />

      {/* Daily Habits */}
      <DailyHabitList
        habits={habits as Habit[]}
        entries={(entries ?? []) as HabitEntry[]}
        streaks={streaks}
        date={today}
      />
    </div>
  );
}
