import { notFound } from "next/navigation";
import { Flame, Trophy, Calendar, Target, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface PublicProgressPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PublicProgressPageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("username", username)
    .single();

  if (!profile) {
    return { title: "Profile Not Found | Groove" };
  }

  const name = profile.display_name || profile.username || "User";
  return {
    title: `${name}'s Progress | Groove`,
    description: `Check out ${name}'s habit tracking progress on Groove`,
  };
}

export default async function PublicProgressPage({ params }: PublicProgressPageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get user profile by username
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  // Get public habits (only show habits where user has opted in to public sharing)
  // For now, show all active habits
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", profile.id)
    .eq("is_archived", false)
    .order("sort_order");

  // Get week dates
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Get entries for this week
  const { data: entries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", profile.id)
    .gte("entry_date", weekStartStr)
    .lte("entry_date", weekEndStr);

  // Get all entries for streak calculation
  const { data: allEntries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", profile.id)
    .order("entry_date", { ascending: false });

  // Calculate stats
  const completedThisWeek = (entries || []).filter(e => e.completed).length;
  const habitCount = habits?.length || 0;
  const maxPossible = habitCount * 7;
  const weeklyRate = maxPossible > 0 ? Math.round((completedThisWeek / maxPossible) * 100) : 0;

  // Calculate streaks per habit
  const streaks: Record<string, number> = {};
  let bestStreak = 0;

  (habits || []).forEach(habit => {
    const habitEntries = (allEntries || [])
      .filter(e => e.habit_id === habit.id && e.completed)
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = today;

    for (const entry of habitEntries) {
      if (entry.entry_date === checkDate) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else if (entry.entry_date < checkDate) {
        break;
      }
    }
    streaks[habit.id] = streak;
    if (streak > bestStreak) bestStreak = streak;
  });

  // Calculate total completions all time
  const totalCompletions = (allEntries || []).filter(e => e.completed).length;

  const userName = profile.display_name || profile.username || "User";
  const initials = userName.slice(0, 2).toUpperCase();

  // Build week grid for each habit
  const weekDays: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDays.push(d.toISOString().split("T")[0]);
  }

  const entriesMap = new Map((entries || []).map(e => [`${e.habit_id}-${e.entry_date}`, e]));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={userName}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold ring-4 ring-white/20">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{userName}</h1>
              <p className="text-white/80">@{profile.username}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{weeklyRate}%</p>
              <p className="text-xs text-white/70">This Week</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-5 h-5 text-orange-300" />
              </div>
              <p className="text-2xl font-bold">{bestStreak}</p>
              <p className="text-xs text-white/70">Best Streak</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="w-5 h-5 text-yellow-300" />
              </div>
              <p className="text-2xl font-bold">{totalCompletions}</p>
              <p className="text-xs text-white/70">Total Check-ins</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{habitCount}</p>
              <p className="text-xs text-white/70">Active Habits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Habits Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          This Week&apos;s Progress
        </h2>

        {habits && habits.length > 0 ? (
          <div className="space-y-4">
            {habits.map(habit => {
              const streak = streaks[habit.id] || 0;
              const habitCompletedThisWeek = weekDays.filter(d => {
                const entry = entriesMap.get(`${habit.id}-${d}`);
                return entry?.completed;
              }).length;

              return (
                <div
                  key={habit.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${habit.color}20` }}
                      >
                        {habit.icon || "✅"}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {habit.name}
                        </h3>
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-sm text-orange-600">
                            <Flame className="w-3 h-3" />
                            <span>{streak} day streak</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-500">
                      {habitCompletedThisWeek}/7
                    </span>
                  </div>

                  {/* Week grid */}
                  <div className="flex gap-1.5">
                    {weekDays.map((day, i) => {
                      const entry = entriesMap.get(`${habit.id}-${day}`);
                      const isCompleted = entry?.completed;
                      const isToday = day === new Date().toISOString().split("T")[0];
                      const dayName = ["M", "T", "W", "T", "F", "S", "S"][i];

                      return (
                        <div key={day} className="flex-1 text-center">
                          <p className="text-xs text-gray-400 mb-1">{dayName}</p>
                          <div
                            className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                              isCompleted
                                ? "text-white"
                                : isToday
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            }`}
                            style={isCompleted ? { backgroundColor: habit.color || "#6366f1" } : {}}
                          >
                            {isCompleted ? "✓" : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <p className="text-gray-500">No habits to display</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Track your own habits with Groove
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Start Tracking
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            Powered by <span className="font-semibold text-primary">Groove</span>
          </p>
        </div>
      </div>
    </div>
  );
}
