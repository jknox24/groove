import { HabitForm } from "@/components/habits/habit-form";
import { createHabit } from "../actions";

export default function NewHabitPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-2xl font-bold text-text mb-6">New Habit</h1>
      <HabitForm onSubmit={createHabit} />
    </div>
  );
}
