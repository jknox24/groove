import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HabitForm } from "@/components/habits/habit-form";
import { updateHabit } from "../../actions";

interface EditHabitPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHabitPage({ params }: EditHabitPageProps) {
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

  // Fetch all habits for stacking options
  const { data: availableHabits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user?.id)
    .eq("is_archived", false)
    .order("name");

  const updateHabitWithId = updateHabit.bind(null, id);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-text mb-6">Edit Habit</h1>
      <HabitForm habit={habit} onSubmit={updateHabitWithId} availableHabits={availableHabits ?? []} />
    </div>
  );
}
