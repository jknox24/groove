import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SortableHabitList } from "@/components/habits/sortable-habit-list";
import type { Habit } from "@/types";

export default async function HabitsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user?.id)
    .eq("is_archived", false)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Habits</h1>
        <Link href="/habits/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Habit
          </Button>
        </Link>
      </div>

      {habits && habits.length > 0 ? (
        <SortableHabitList initialHabits={habits as Habit[]} />
      ) : (
        <div className="border border-border rounded-lg p-8 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
              <Plus className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">
              No habits yet
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Create your first habit to start tracking.
            </p>
            <Link href="/habits/new">
              <Button>Create Habit</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
