"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function seedDemoPartner() {
  const serverClient = await createServerClient();
  const { data: { user } } = await serverClient.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Use service role client for creating demo data
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceKey) {
    return { error: "Service role key not configured" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if demo partner already exists
    const { data: existingPartner } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", "alex_demo")
      .single();

    let fakePartnerId: string;

    if (existingPartner) {
      fakePartnerId = existingPartner.id;

      // Check if partnership already exists
      const { data: existingPartnership } = await supabase
        .from("partnerships")
        .select("id")
        .or(`and(requester_id.eq.${fakePartnerId},partner_id.eq.${user.id}),and(requester_id.eq.${user.id},partner_id.eq.${fakePartnerId})`)
        .single();

      if (existingPartnership) {
        return { error: "Demo partner already added! Check your Partners page." };
      }
    } else {
      // Create fake partner profile
      fakePartnerId = crypto.randomUUID();

      const { error: profileError } = await supabase.from("profiles").insert({
        id: fakePartnerId,
        username: "alex_demo",
        display_name: "Alex Chen",
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Profile error:", profileError);
        return { error: "Failed to create demo partner profile" };
      }
    }

    // Create partnership
    const { data: partnership, error: partnershipError } = await supabase
      .from("partnerships")
      .insert({
        requester_id: fakePartnerId,
        partner_id: user.id,
        status: "active",
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (partnershipError) {
      console.error("Partnership error:", partnershipError);
      return { error: "Failed to create partnership" };
    }

    // Create habits for fake partner
    const habits = [
      { name: "Morning Run", icon: "🏃", color: "#22c55e" },
      { name: "Read 30 mins", icon: "📚", color: "#8b5cf6" },
      { name: "Meditate", icon: "🧘", color: "#f59e0b" },
      { name: "Drink Water", icon: "💧", color: "#3b82f6" },
    ];

    const createdHabits: string[] = [];

    for (let i = 0; i < habits.length; i++) {
      const habit = habits[i];
      const { data: habitData, error: habitError } = await supabase
        .from("habits")
        .insert({
          user_id: fakePartnerId,
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          tracking_type: "boolean",
          frequency: "daily",
          sort_order: i,
          is_archived: false,
        })
        .select()
        .single();

      if (!habitError && habitData) {
        createdHabits.push(habitData.id);
      }
    }

    // Create habit entries for the past 14 days
    const today = new Date();
    const entries: {
      habit_id: string;
      user_id: string;
      entry_date: string;
      completed: boolean;
    }[] = [];

    for (const habitId of createdHabits) {
      for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split("T")[0];

        // Random completion with higher chance for recent days
        const completionChance = daysAgo < 3 ? 0.9 : daysAgo < 7 ? 0.75 : 0.6;
        const completed = Math.random() < completionChance;

        entries.push({
          habit_id: habitId,
          user_id: fakePartnerId,
          entry_date: dateStr,
          completed,
        });
      }
    }

    await supabase.from("habit_entries").insert(entries);

    // Share habits with partnership
    for (const habitId of createdHabits) {
      await supabase.from("habit_shares").insert({
        habit_id: habitId,
        partnership_id: partnership.id,
        can_view: true,
        can_verify: true,
      });
    }

    // Send a welcome nudge
    await supabase.from("nudges").insert({
      from_user_id: fakePartnerId,
      to_user_id: user.id,
      partnership_id: partnership.id,
      message: "Hey! Excited to be accountability partners! Let's crush our goals together! 💪",
      type: "encouragement",
    });

    return {
      success: true,
      partnerName: "Alex Chen",
      partnerId: fakePartnerId
    };
  } catch (err) {
    console.error("Seed error:", err);
    return { error: "An unexpected error occurred" };
  }
}
