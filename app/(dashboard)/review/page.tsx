import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WeeklyReview } from "@/components/insights/weekly-review";

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the start and end of the current week (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Fetch user's active habits
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("sort_order");

  // Fetch entries for this week
  const { data: entries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("entry_date", weekStartStr)
    .lte("entry_date", weekEndStr);

  // Fetch entries for previous week for comparison
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekEnd);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);

  const { data: prevWeekEntries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("entry_date", prevWeekStart.toISOString().split("T")[0])
    .lte("entry_date", prevWeekEnd.toISOString().split("T")[0]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <WeeklyReview
        habits={habits ?? []}
        entries={entries ?? []}
        prevWeekEntries={prevWeekEntries ?? []}
        weekStart={weekStartStr}
        weekEnd={weekEndStr}
      />
    </div>
  );
}
