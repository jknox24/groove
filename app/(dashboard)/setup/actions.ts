"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HABIT_TEMPLATES } from "@/lib/constants";

export async function createHabitsFromTemplates(templateIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (templateIds.length === 0) {
    // Skip - go straight to dashboard
    redirect("/");
  }

  // Get template data for selected IDs
  const selectedTemplates = HABIT_TEMPLATES.filter((t) =>
    templateIds.includes(t.id)
  );

  // Create habits from templates
  const habitsToCreate = selectedTemplates.map((template, index) => ({
    user_id: user.id,
    name: template.name,
    icon: template.icon,
    color: template.color,
    description: template.description,
    tracking_type: "boolean",
    frequency: "daily",
    verification_type: "self",
    sort_order: index,
  }));

  const { error } = await supabase.from("habits").insert(habitsToCreate);

  if (error) {
    console.error("Error creating habits:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/habits");
  redirect("/");
}

export async function createCustomHabit(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const icon = formData.get("icon") as string;
  const color = formData.get("color") as string;

  if (!name?.trim()) {
    return { error: "Habit name is required" };
  }

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name: name.trim(),
    icon: icon || "✨",
    color: color || "#7c3aed",
    tracking_type: "boolean",
    frequency: "daily",
    verification_type: "self",
  });

  if (error) {
    console.error("Error creating habit:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/habits");
  redirect("/");
}
