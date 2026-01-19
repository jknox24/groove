import { Sparkles, TrendingUp, Target, Flame, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateStreaks } from "@/lib/utils/streaks";
import { generateInsights } from "@/lib/ai/insights";
import {
  WeeklyTrendChart,
  DayOfWeekChart,
  CompletionHeatmap,
} from "@/components/insights/analytics-charts";
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

  // Calculate weekly trend data (last 4 weeks)
  const today = new Date();
  const weeklyTrendData = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (w * 7 + 6));
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - w * 7);

    let completed = 0;
    let total = 0;

    for (let d = 0; d < 7; d++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(weekStart.getDate() + d);
      const dateStr = checkDate.toISOString().split("T")[0];

      (allEntries || []).forEach((entry) => {
        if (entry.entry_date === dateStr) {
          total++;
          if (entry.completed) completed++;
        }
      });
    }

    weeklyTrendData.push({
      week: w === 0 ? "This Week" : w === 1 ? "Last Week" : `${w}w ago`,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }

  // Calculate day-of-week performance
  const dayStats: { [key: number]: { completed: number; total: number } } = {};
  for (let i = 0; i < 7; i++) dayStats[i] = { completed: 0, total: 0 };

  (allEntries || []).forEach((entry) => {
    const date = new Date(entry.entry_date);
    const dayOfWeek = date.getDay();
    dayStats[dayOfWeek].total++;
    if (entry.completed) dayStats[dayOfWeek].completed++;
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeekData = [1, 2, 3, 4, 5, 6, 0].map((i) => ({
    day: dayNames[i],
    shortDay: dayNames[i],
    rate: dayStats[i].total > 0
      ? Math.round((dayStats[i].completed / dayStats[i].total) * 100)
      : 0,
  }));

  // Calculate heatmap data (daily completions)
  const heatmapData: { date: string; completed: number; total: number }[] = [];
  const dateMap = new Map<string, { completed: number; total: number }>();

  (allEntries || []).forEach((entry) => {
    const existing = dateMap.get(entry.entry_date) || { completed: 0, total: 0 };
    existing.total++;
    if (entry.completed) existing.completed++;
    dateMap.set(entry.entry_date, existing);
  });

  dateMap.forEach((value, date) => {
    heatmapData.push({ date, ...value });
  });

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

      {/* Analytics Charts */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <WeeklyTrendChart data={weeklyTrendData} />
          <DayOfWeekChart data={dayOfWeekData} />
          <CompletionHeatmap data={heatmapData} weeks={8} />
        </CardContent>
      </Card>

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
