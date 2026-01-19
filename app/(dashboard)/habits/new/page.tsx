import { createClient } from "@/lib/supabase/server";
import { HabitForm } from "@/components/habits/habit-form";
import { createHabit } from "../actions";

export default async function NewHabitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch existing habits for stacking options
  const { data: availableHabits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user?.id)
    .eq("is_archived", false)
    .order("name");

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-text mb-6">New Habit</h1>
      <HabitForm onSubmit={createHabit} availableHabits={availableHabits ?? []} />
    </div>
  );
}
