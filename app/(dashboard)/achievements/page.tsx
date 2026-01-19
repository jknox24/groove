import { createClient } from "@/lib/supabase/server";
import { calculateStreaks } from "@/lib/utils/streaks";
import {
  calculateAchievements,
  getTierBackground,
  type EarnedAchievement,
} from "@/lib/achievements";
import { cn } from "@/lib/utils";
import type { HabitEntry } from "@/types";

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all habits
  const { data: habits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", user?.id);

  // Fetch all entries
  const { data: entries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", user?.id);

  // Calculate stats
  const allEntries = (entries ?? []) as HabitEntry[];
  const completedEntries = allEntries.filter((e) => e.completed);

  // Calculate best streak across all habits
  let bestStreak = 0;
  let currentStreak = 0;
  const habitIds = new Set(allEntries.map((e) => e.habit_id));

  habitIds.forEach((habitId) => {
    const habitEntries = allEntries.filter((e) => e.habit_id === habitId);
    const streakData = calculateStreaks(habitEntries);
    if (streakData.bestStreak > bestStreak) {
      bestStreak = streakData.bestStreak;
    }
    if (streakData.currentStreak > currentStreak) {
      currentStreak = streakData.currentStreak;
    }
  });

  // Calculate perfect days (all habits completed)
  const entriesByDate = new Map<string, HabitEntry[]>();
  allEntries.forEach((entry) => {
    const existing = entriesByDate.get(entry.entry_date) || [];
    entriesByDate.set(entry.entry_date, [...existing, entry]);
  });

  let perfectDays = 0;
  const habitCount = habits?.length || 0;
  entriesByDate.forEach((dayEntries) => {
    const completedCount = dayEntries.filter((e) => e.completed).length;
    if (completedCount >= habitCount && habitCount > 0) {
      perfectDays++;
    }
  });

  // Check for early/late completions
  const hasEarlyCompletion = completedEntries.some((e) => {
    const hour = new Date(e.created_at).getHours();
    return hour < 7;
  });

  const hasLateCompletion = completedEntries.some((e) => {
    const hour = new Date(e.created_at).getHours();
    return hour >= 22;
  });

  const stats = {
    totalCompletions: completedEntries.length,
    bestStreak,
    currentStreak,
    perfectDays,
    habitsCreated: habits?.length || 0,
    hasEarlyCompletion,
    hasLateCompletion,
  };

  const achievements = calculateAchievements(stats);
  const earnedCount = achievements.filter((a) => a.earnedAt).length;

  // Group by category
  const streakAchievements = achievements.filter((a) => a.category === "streak");
  const completionAchievements = achievements.filter(
    (a) => a.category === "completion"
  );
  const consistencyAchievements = achievements.filter(
    (a) => a.category === "consistency"
  );
  const specialAchievements = achievements.filter((a) => a.category === "special");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Achievements</h1>
        <p className="text-gray-500">
          {earnedCount} of {achievements.length} badges earned
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Check-ins" value={stats.totalCompletions} />
        <StatCard label="Best Streak" value={`${stats.bestStreak} days`} />
        <StatCard label="Perfect Days" value={stats.perfectDays} />
        <StatCard label="Habits Created" value={stats.habitsCreated} />
      </div>

      {/* Achievement Categories */}
      <div className="space-y-8">
        <AchievementSection title="🔥 Streak Badges" achievements={streakAchievements} />
        <AchievementSection
          title="✓ Completion Badges"
          achievements={completionAchievements}
        />
        <AchievementSection
          title="🎯 Consistency Badges"
          achievements={consistencyAchievements}
        />
        <AchievementSection title="⭐ Special Badges" achievements={specialAchievements} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function AchievementSection({
  title,
  achievements,
}: {
  title: string;
  achievements: EarnedAchievement[];
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: EarnedAchievement }) {
  const isEarned = !!achievement.earnedAt;

  return (
    <div
      className={cn(
        "relative rounded-2xl p-4 text-center transition-all",
        isEarned
          ? "bg-white border-2 shadow-md"
          : "bg-gray-50 border border-gray-200 opacity-60"
      )}
      style={{
        borderColor: isEarned ? getTierBackground(achievement.tier).split(",")[0].split("(")[1] : undefined,
      }}
    >
      {/* Badge icon */}
      <div
        className={cn(
          "w-14 h-14 mx-auto rounded-full flex items-center justify-center text-2xl mb-3",
          isEarned ? "shadow-lg" : ""
        )}
        style={{
          background: isEarned
            ? getTierBackground(achievement.tier)
            : "#e5e7eb",
        }}
      >
        {achievement.icon}
      </div>

      {/* Name */}
      <h3
        className={cn(
          "font-semibold text-sm mb-1",
          isEarned ? "text-gray-900" : "text-gray-500"
        )}
      >
        {achievement.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>

      {/* Progress bar */}
      {!isEarned && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {achievement.progress}%
          </p>
        </div>
      )}

      {/* Earned indicator */}
      {isEarned && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
