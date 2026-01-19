import { createClient } from "@supabase/supabase-js";

// Run with: npx tsx scripts/seed-partner.ts YOUR_USER_ID
// Get your user ID from Supabase dashboard or browser dev tools

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.log("Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedPartner(yourUserId: string) {
  console.log("🌱 Seeding fake partner data...\n");

  // Create fake partner profile
  const fakePartnerId = crypto.randomUUID();

  const { error: profileError } = await supabase.from("profiles").insert({
    id: fakePartnerId,
    username: "alex_habits",
    display_name: "Alex Chen",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.error("Error creating profile:", profileError.message);
    return;
  }
  console.log("✅ Created fake partner: Alex Chen (@alex_habits)");

  // Create partnership
  const { data: partnership, error: partnershipError } = await supabase
    .from("partnerships")
    .insert({
      requester_id: fakePartnerId,
      partner_id: yourUserId,
      status: "active",
      accepted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (partnershipError) {
    console.error("Error creating partnership:", partnershipError.message);
    return;
  }
  console.log("✅ Created active partnership");

  // Create habits for fake partner
  const habits = [
    { name: "Morning Run", icon: "🏃", color: "#22c55e" },
    { name: "Read 30 mins", icon: "📚", color: "#8b5cf6" },
    { name: "Meditate", icon: "🧘", color: "#f59e0b" },
    { name: "Drink Water", icon: "💧", color: "#3b82f6" },
  ];

  const createdHabits: { id: string; name: string }[] = [];

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

    if (habitError) {
      console.error(`Error creating habit ${habit.name}:`, habitError.message);
      continue;
    }
    createdHabits.push({ id: habitData.id, name: habit.name });
    console.log(`✅ Created habit: ${habit.icon} ${habit.name}`);
  }

  // Create habit entries for the past 14 days
  const today = new Date();
  const entries: {
    habit_id: string;
    user_id: string;
    entry_date: string;
    completed: boolean;
  }[] = [];

  for (const habit of createdHabits) {
    for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split("T")[0];

      // Random completion with higher chance for recent days
      const completionChance = daysAgo < 3 ? 0.9 : daysAgo < 7 ? 0.75 : 0.6;
      const completed = Math.random() < completionChance;

      entries.push({
        habit_id: habit.id,
        user_id: fakePartnerId,
        entry_date: dateStr,
        completed,
      });
    }
  }

  const { error: entriesError } = await supabase.from("habit_entries").insert(entries);

  if (entriesError) {
    console.error("Error creating entries:", entriesError.message);
    return;
  }
  console.log(`✅ Created ${entries.length} habit entries (14 days × ${createdHabits.length} habits)`);

  // Share habits with partnership
  for (const habit of createdHabits) {
    const { error: shareError } = await supabase.from("habit_shares").insert({
      habit_id: habit.id,
      partnership_id: partnership.id,
      can_view: true,
      can_verify: true,
    });

    if (shareError) {
      console.error(`Error sharing habit:`, shareError.message);
    }
  }
  console.log("✅ Shared all habits with you");

  // Send a welcome nudge
  const { error: nudgeError } = await supabase.from("nudges").insert({
    from_user_id: fakePartnerId,
    to_user_id: yourUserId,
    partnership_id: partnership.id,
    message: "Hey! Excited to be accountability partners! Let's crush our goals together! 💪",
    type: "encouragement",
  });

  if (nudgeError) {
    console.error("Error creating nudge:", nudgeError.message);
  } else {
    console.log("✅ Sent welcome nudge");
  }

  console.log("\n🎉 Done! You should now see Alex Chen as a partner.");
  console.log(`   Partner ID: ${fakePartnerId}`);
  console.log(`   Partnership ID: ${partnership.id}`);
  console.log("\n   Go to /partners to see them!");
}

// Get user ID from command line
const yourUserId = process.argv[2];

if (!yourUserId) {
  console.log("Usage: npx tsx scripts/seed-partner.ts YOUR_USER_ID");
  console.log("\nTo find your user ID:");
  console.log("1. Open your app in browser");
  console.log("2. Open DevTools (F12) → Application → Local Storage");
  console.log("3. Look for supabase auth token, find 'sub' field");
  console.log("   OR check Supabase Dashboard → Authentication → Users");
  process.exit(1);
}

seedPartner(yourUserId);
