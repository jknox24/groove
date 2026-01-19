require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Find user from profiles - look for any profile
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .limit(10);

  if (profilesError) {
    console.error('Error listing profiles:', profilesError.message);
    return;
  }

  console.log('Profiles found:', profiles);

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found');
    return;
  }

  // Use the first profile (the user)
  const yourUserId = profiles[0].id;
  console.log('Using user:', yourUserId);

  // Check if demo partner already exists
  const { data: existingPartner } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", "alex_demo")
    .single();

  let fakePartnerId;

  if (existingPartner) {
    fakePartnerId = existingPartner.id;
    console.log('Demo partner already exists:', fakePartnerId);

    // Check if partnership already exists
    const { data: existingPartnership } = await supabase
      .from("partnerships")
      .select("id")
      .or(`and(requester_id.eq.${fakePartnerId},partner_id.eq.${yourUserId}),and(requester_id.eq.${yourUserId},partner_id.eq.${fakePartnerId})`)
      .single();

    if (existingPartnership) {
      console.log('Partnership already exists! Check /partners');
      return;
    }
  } else {
    // Create fake auth user first
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'alex.demo@example.com',
      password: 'demo123456',
      email_confirm: true,
      user_metadata: { display_name: 'Alex Chen' }
    });

    if (authError) {
      console.error("Error creating auth user:", authError.message);
      return;
    }

    fakePartnerId = authUser.user.id;
    console.log("Created auth user:", fakePartnerId);

    // Update the profile that was auto-created
    const { error: profileError } = await supabase.from("profiles").update({
      username: "alex_demo",
      display_name: "Alex Chen",
    }).eq("id", fakePartnerId);

    if (profileError) {
      console.error("Error updating profile:", profileError.message);
      return;
    }
    console.log("Updated profile: Alex Chen (@alex_demo)");
  }

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
  console.log("Created partnership");

  // Create habits
  const habits = [
    { name: "Morning Run", icon: "🏃", color: "#22c55e" },
    { name: "Read 30 mins", icon: "📚", color: "#8b5cf6" },
    { name: "Meditate", icon: "🧘", color: "#f59e0b" },
    { name: "Drink Water", icon: "💧", color: "#3b82f6" },
  ];

  const createdHabits = [];

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
      console.log(`Created habit: ${habit.icon} ${habit.name}`);
    } else if (habitError) {
      console.log(`Error creating habit: ${habitError.message}`);
    }
  }

  // Create entries for past 14 days
  const today = new Date();
  const entries = [];

  for (const habitId of createdHabits) {
    for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split("T")[0];

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

  const { error: entriesError } = await supabase.from("habit_entries").insert(entries);
  if (entriesError) {
    console.log(`Error creating entries: ${entriesError.message}`);
  } else {
    console.log(`Created ${entries.length} habit entries`);
  }

  // Share habits
  for (const habitId of createdHabits) {
    const { error: shareError } = await supabase.from("habit_shares").insert({
      habit_id: habitId,
      partnership_id: partnership.id,
      can_view: true,
      can_verify: true,
    });
    if (shareError) {
      console.log(`Error sharing habit: ${shareError.message}`);
    }
  }
  console.log("Shared all habits");

  // Send nudge
  const { error: nudgeError } = await supabase.from("nudges").insert({
    from_user_id: fakePartnerId,
    to_user_id: yourUserId,
    partnership_id: partnership.id,
    message: "Hey! Excited to be accountability partners! Let's crush our goals together! 💪",
    type: "encouragement",
  });
  if (nudgeError) {
    console.log(`Error sending nudge: ${nudgeError.message}`);
  } else {
    console.log("Sent welcome nudge");
  }

  console.log("\n✅ Done! Go to /partners to see Alex Chen");
}

main().catch(console.error);
