"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function checkInHabit(
  habitId: string,
  completed: boolean,
  value?: number,
  date?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const entryDate = date ?? new Date().toISOString().split("T")[0];

  // Check if entry exists
  const { data: existing } = await supabase
    .from("habit_entries")
    .select("id")
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .eq("entry_date", entryDate)
    .single();

  if (existing) {
    // Update existing entry
    const { error } = await supabase
      .from("habit_entries")
      .update({
        completed,
        value: value ?? null,
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating entry:", error);
      throw new Error(error.message);
    }
  } else {
    // Create new entry
    const { error } = await supabase.from("habit_entries").insert({
      habit_id: habitId,
      user_id: user.id,
      entry_date: entryDate,
      completed,
      value: value ?? null,
    });

    if (error) {
      console.error("Error creating entry:", error);
      throw new Error(error.message);
    }
  }

  revalidatePath("/");
}

export async function updateEntryNote(entryId: string, note: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("habit_entries")
    .update({ note })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating entry note:", error);
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function updateEntryMood(
  habitId: string,
  date: string,
  mood: number,
  energy: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("habit_entries")
    .update({ mood, energy })
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .eq("entry_date", date);

  if (error) {
    console.error("Error updating mood:", error);
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function updateEntryPhoto(
  habitId: string,
  date: string,
  photoUrl: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // First ensure the entry exists
  const { data: existing } = await supabase
    .from("habit_entries")
    .select("id")
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .eq("entry_date", date)
    .single();

  if (existing) {
    // Update existing entry with photo
    const { error } = await supabase
      .from("habit_entries")
      .update({ photo_url: photoUrl })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating photo:", error);
      throw new Error(error.message);
    }
  } else {
    // Create new entry with just the photo
    const { error } = await supabase.from("habit_entries").insert({
      habit_id: habitId,
      user_id: user.id,
      entry_date: date,
      completed: false,
      photo_url: photoUrl,
    });

    if (error) {
      console.error("Error creating entry with photo:", error);
      throw new Error(error.message);
    }
  }

  revalidatePath("/");
  revalidatePath(`/habits/${habitId}`);
}
