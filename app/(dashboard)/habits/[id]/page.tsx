import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, Archive, Flame, Trophy, Target, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitCalendar } from "@/components/habits/habit-calendar";
import { calculateStreaks } from "@/lib/utils/streaks";
import { deleteHabit, archiveHabit } from "../actions";
import type { HabitEntry } from "@/types";

interface HabitDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HabitDetailPage({ params }: HabitDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: habit } = await supabase
    .from("habits")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (!habit) {
    notFound();
  }

  // Get all entries for this habit
  const { data: entries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("habit_id", id)
    .order("entry_date", { ascending: false });

  const allEntries = (entries ?? []) as HabitEntry[];
  const stats = calculateStreaks(allEntries);

  const deleteHabitWithId = deleteHabit.bind(null, id);
  const archiveHabitWithId = archiveHabit.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${habit.color}15` }}
        >
          {habit.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-text">{habit.name}</h1>
          {habit.description && (
            <p className="text-text-secondary mt-1">{habit.description}</p>
          )}
        </div>
        <Link href={`/habits/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Flame className="w-5 h-5 mx-auto mb-1 text-accent" />
            <div className="text-2xl font-bold text-text">{stats.currentStreak}</div>
            <div className="text-xs text-text-muted">Current Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-warning" />
            <div className="text-2xl font-bold text-text">{stats.bestStreak}</div>
            <div className="text-xs text-text-muted">Best Streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-text">{stats.completionRate7Days}%</div>
            <div className="text-xs text-text-muted">Last 7 Days</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Heatmap */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <HabitCalendar
            entries={allEntries}
            color={habit.color || "#1B4332"}
            weeks={12}
          />
        </CardContent>
      </Card>

      {/* Completion Rates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Completion Rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Last 7 days</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-border-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${stats.completionRate7Days}%` }}
                />
              </div>
              <span className="text-sm font-medium w-10 text-right">
                {stats.completionRate7Days}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Last 30 days</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-border-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${stats.completionRate30Days}%` }}
                />
              </div>
              <span className="text-sm font-medium w-10 text-right">
                {stats.completionRate30Days}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">All time</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-border-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${stats.completionRateAllTime}%` }}
                />
              </div>
              <span className="text-sm font-medium w-10 text-right">
                {stats.completionRateAllTime}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      {allEntries.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allEntries.slice(0, 7).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        entry.completed
                          ? "bg-primary text-white"
                          : "bg-border-subtle text-text-muted"
                      }`}
                    >
                      {entry.completed ? "✓" : "–"}
                    </div>
                    <span className="text-sm text-text-secondary">
                      {new Date(entry.entry_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {entry.photo_url && (
                      <a
                        href={entry.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded overflow-hidden border border-border hover:border-primary transition-colors"
                      >
                        <img
                          src={entry.photo_url}
                          alt="Verification"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.partner_verified && (
                      <div className="flex items-center gap-1 text-primary" title="Verified by partner">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                    {entry.value && (
                      <span className="text-sm font-medium">
                        {entry.value}
                        {habit.target_unit && ` ${habit.target_unit}`}
                      </span>
                    )}
                    {entry.note && (
                      <span className="text-sm text-text-muted truncate max-w-[150px]">
                        {entry.note}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Frequency</span>
            <span className="font-medium">
              {habit.frequency === "daily" && "Every day"}
              {habit.frequency === "weekly" && "Once per week"}
              {habit.frequency === "specific_days" &&
                `${habit.frequency_days?.length} days/week`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Tracking</span>
            <span className="font-medium capitalize">
              {habit.tracking_type}
              {habit.target_value &&
                ` (${habit.target_value}${habit.target_unit ? ` ${habit.target_unit}` : ""})`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Created</span>
            <span className="font-medium">
              {new Date(habit.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Total completions</span>
            <span className="font-medium">{stats.totalCompleted}</span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <form action={archiveHabitWithId}>
            <Button
              variant="outline"
              type="submit"
              className="w-full justify-start"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive Habit
            </Button>
          </form>

          <form action={deleteHabitWithId}>
            <Button
              variant="outline"
              type="submit"
              className="w-full justify-start text-error hover:text-error hover:border-error"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Habit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
