"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendProgressUpdate(partnerIds: string[], completionRate: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get user profile for name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.display_name || "Your partner";

  // Create progress message
  let message: string;
  if (completionRate >= 90) {
    message = `🏆 ${userName} crushed it this week with ${completionRate}% completion! Amazing work!`;
  } else if (completionRate >= 70) {
    message = `🔥 ${userName} completed ${completionRate}% of their habits this week! Great progress!`;
  } else if (completionRate >= 50) {
    message = `💪 ${userName} is ${completionRate}% through their weekly habits. Keep going!`;
  } else {
    message = `🌱 ${userName} shared their progress: ${completionRate}% this week. Every step counts!`;
  }

  // Get partnerships with these partners
  const { data: partnerships } = await supabase
    .from("partnerships")
    .select("id, requester_id, partner_id")
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
    .eq("status", "active");

  if (!partnerships) {
    return { error: "No active partnerships found" };
  }

  // Create nudges for each partner
  const nudges = partnerIds.map((partnerId) => {
    const partnership = partnerships.find(
      (p) =>
        (p.requester_id === user.id && p.partner_id === partnerId) ||
        (p.partner_id === user.id && p.requester_id === partnerId)
    );

    return {
      from_user_id: user.id,
      to_user_id: partnerId,
      partnership_id: partnership?.id,
      message,
      type: "celebration" as const,
    };
  });

  const { error } = await supabase.from("nudges").insert(nudges);

  if (error) {
    console.error("Error sending progress updates:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
