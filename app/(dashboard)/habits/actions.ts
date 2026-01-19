"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createHabit(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;
  const color = formData.get("color") as string;
  const trackingType = formData.get("tracking_type") as string;
  const targetValue = formData.get("target_value") as string;
  const targetUnit = formData.get("target_unit") as string;
  const frequency = formData.get("frequency") as string;
  const frequencyDays = formData.get("frequency_days") as string;
  const verificationType = formData.get("verification_type") as string;
  const cueHabitId = formData.get("cue_habit_id") as string;
  const cueType = formData.get("cue_type") as string;
  const timeOfDay = formData.get("time_of_day") as string;

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name,
    description: description || null,
    icon,
    color,
    tracking_type: trackingType,
    target_value: targetValue ? parseFloat(targetValue) : null,
    target_unit: targetUnit || null,
    frequency,
    frequency_days: frequency === "specific_days" ? JSON.parse(frequencyDays) : null,
    verification_type: verificationType || "self",
    cue_habit_id: cueHabitId || null,
    cue_type: cueType || null,
    time_of_day: timeOfDay || "anytime",
  });

  if (error) {
    console.error("Error creating habit:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/habits");
  redirect("/habits");
}

export async function updateHabit(habitId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;
  const color = formData.get("color") as string;
  const trackingType = formData.get("tracking_type") as string;
  const targetValue = formData.get("target_value") as string;
  const targetUnit = formData.get("target_unit") as string;
  const frequency = formData.get("frequency") as string;
  const frequencyDays = formData.get("frequency_days") as string;
  const verificationType = formData.get("verification_type") as string;
  const cueHabitId = formData.get("cue_habit_id") as string;
  const cueType = formData.get("cue_type") as string;
  const timeOfDay = formData.get("time_of_day") as string;

  const { error } = await supabase
    .from("habits")
    .update({
      name,
      description: description || null,
      icon,
      color,
      tracking_type: trackingType,
      target_value: targetValue ? parseFloat(targetValue) : null,
      target_unit: targetUnit || null,
      frequency,
      frequency_days: frequency === "specific_days" ? JSON.parse(frequencyDays) : null,
      verification_type: verificationType || "self",
      cue_habit_id: cueHabitId || null,
      cue_type: cueType || null,
      time_of_day: timeOfDay || "anytime",
    })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating habit:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/habits");
  revalidatePath(`/habits/${habitId}`);
  redirect("/habits");
}

export async function deleteHabit(habitId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting habit:", error);
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/habits");
  redirect("/habits");
}

export async function toggleHabitFocus(habitId: string, isFocus: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("habits")
    .update({ is_focus: isFocus })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function reorderHabits(habitIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Update sort_order for each habit
  const updates = habitIds.map((id, index) =>
    supabase
      .from("habits")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("user_id", user.id)
  );

  await Promise.all(updates);

  revalidatePath("/");
  revalidatePath("/habits");
}

export async function archiveHabit(habitId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("habits")
    .update({ is_archived: true })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error archiving habit:", error);
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/habits");
  redirect("/habits");
}
