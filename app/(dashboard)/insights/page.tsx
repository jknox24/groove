import { Sparkles, TrendingUp, Target, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateStreaks } from "@/lib/utils/streaks";
import { generateInsights } from "@/lib/ai/insights";
import type { HabitEntry } from "@/types";

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch all habits with entries
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false);

  // Fetch all entries for these habits
  const habitIds = habits?.map(h => h.id) || [];
  const { data: allEntries } = await supabase
    .from("habit_entries")
    .select("*")
    .in("habit_id", habitIds.length > 0 ? habitIds : ["none"]);

  // Calculate stats for each habit
  const habitData = (habits || []).map(habit => {
    const entries = (allEntries || []).filter(e => e.habit_id === habit.id) as HabitEntry[];
    const stats = calculateStreaks(entries);

    return {
      name: habit.name,
      frequency: habit.frequency,
      trackingType: habit.tracking_type,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      completionRate7Days: stats.completionRate7Days,
      completionRate30Days: stats.completionRate30Days,
      totalCompleted: stats.totalCompleted,
      recentEntries: entries.slice(0, 14).map(e => ({
        date: e.entry_date,
        completed: e.completed,
        value: e.value,
      })),
    };
  });

  // Calculate overall stats
  const totalHabits = habitData.length;
  const avgCompletion7Days = totalHabits > 0
    ? Math.round(habitData.reduce((acc, h) => acc + h.completionRate7Days, 0) / totalHabits)
    : 0;
  const bestOverallStreak = Math.max(...habitData.map(h => h.bestStreak), 0);

  // Generate AI insights
  let insights = "";
  try {
    insights = await generateInsights(habitData);
  } catch (error) {
    console.error("Error generating insights:", error);
    insights = "Unable to generate AI insights. Make sure your ANTHROPIC_API_KEY is configured.";
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Insights
        </h1>
        <p className="text-text-secondary mt-1">
          AI-powered analysis of your habit journey
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-text">{totalHabits}</div>
            <div className="text-xs text-text-muted">Active Habits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-accent" />
            <div className="text-2xl font-bold text-text">{avgCompletion7Days}%</div>
            <div className="text-xs text-text-muted">Avg 7-Day Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-warning" />
            <div className="text-2xl font-bold text-text">{bestOverallStreak}</div>
            <div className="text-xs text-text-muted">Best Streak</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-text-secondary">
            {insights.split("\n").map((line, i) => (
              <p key={i} className={line.startsWith("-") || line.startsWith("•") ? "ml-2" : ""}>
                {line}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Habit Breakdown */}
      {habitData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Habit Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {habitData.map((habit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{habit.name}</p>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{habit.currentStreak} day streak</span>
                    <span>·</span>
                    <span>{habit.completionRate7Days}% this week</span>
                  </div>
                </div>
                <div className="w-20 h-2 bg-border-subtle rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${habit.completionRate7Days}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
