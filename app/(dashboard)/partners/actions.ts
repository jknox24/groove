"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInviteLink() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Generate a unique invite code
  const inviteCode = crypto.randomUUID().slice(0, 8);

  // Store the invite in the database (we'll use a simple approach with profiles)
  // In production, you might want a separate invites table with expiration
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  // Return the invite link with encoded user info
  const inviteData = Buffer.from(JSON.stringify({
    from: user.id,
    code: inviteCode,
    name: profile.display_name || profile.username || "A user",
  })).toString("base64url");

  return {
    inviteLink: `/invite/${inviteData}`,
    inviteCode,
  };
}

export async function acceptPartnership(requesterId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if partnership request exists
  const { data: existing } = await supabase
    .from("partnerships")
    .select("*")
    .eq("requester_id", requesterId)
    .eq("partner_id", user.id)
    .eq("status", "pending")
    .single();

  if (!existing) {
    throw new Error("Partnership request not found");
  }

  // Accept the partnership
  const { error } = await supabase
    .from("partnerships")
    .update({
      status: "active",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    console.error("Error accepting partnership:", error);
    throw new Error(error.message);
  }

  revalidatePath("/partners");
}

export async function declinePartnership(requesterId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("partnerships")
    .update({ status: "declined" })
    .eq("requester_id", requesterId)
    .eq("partner_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Error declining partnership:", error);
    throw new Error(error.message);
  }

  revalidatePath("/partners");
}

export async function endPartnership(partnershipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Can end partnership if you're either the requester or partner
  const { error } = await supabase
    .from("partnerships")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("id", partnershipId)
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`);

  if (error) {
    console.error("Error ending partnership:", error);
    throw new Error(error.message);
  }

  revalidatePath("/partners");
}

export async function createPartnershipRequest(partnerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (user.id === partnerId) {
    return { error: "Cannot partner with yourself" };
  }

  // Check if partnership already exists (in either direction)
  const { data: existing } = await supabase
    .from("partnerships")
    .select("*")
    .or(`and(requester_id.eq.${user.id},partner_id.eq.${partnerId}),and(requester_id.eq.${partnerId},partner_id.eq.${user.id})`)
    .not("status", "in", "(declined,ended)")
    .single();

  if (existing) {
    return { error: "Partnership already exists or is pending" };
  }

  // Create the partnership request
  const { error } = await supabase.from("partnerships").insert({
    requester_id: user.id,
    partner_id: partnerId,
    status: "pending",
  });

  if (error) {
    console.error("Error creating partnership:", error);
    return { error: error.message };
  }

  revalidatePath("/partners");
  return { success: true };
}

export async function shareHabitWithPartner(
  habitId: string,
  partnershipId: string,
  canVerify: boolean = false
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify the habit belongs to the user
  const { data: habit } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single();

  if (!habit) {
    throw new Error("Habit not found");
  }

  // Check if already shared
  const { data: existingShare } = await supabase
    .from("habit_shares")
    .select("id")
    .eq("habit_id", habitId)
    .eq("partnership_id", partnershipId)
    .single();

  if (existingShare) {
    // Update existing share
    const { error } = await supabase
      .from("habit_shares")
      .update({ can_verify: canVerify })
      .eq("id", existingShare.id);

    if (error) throw new Error(error.message);
  } else {
    // Create new share
    const { error } = await supabase.from("habit_shares").insert({
      habit_id: habitId,
      partnership_id: partnershipId,
      can_view: true,
      can_verify: canVerify,
    });

    if (error) throw new Error(error.message);
  }

  revalidatePath("/partners");
  revalidatePath(`/habits/${habitId}`);
}

export async function unshareHabit(habitId: string, partnershipId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("habit_shares")
    .delete()
    .eq("habit_id", habitId)
    .eq("partnership_id", partnershipId);

  if (error) {
    console.error("Error unsharing habit:", error);
    throw new Error(error.message);
  }

  revalidatePath("/partners");
  revalidatePath(`/habits/${habitId}`);
}

export async function verifyPartnerEntry(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get the entry and check if user can verify it
  const { data: entry } = await supabase
    .from("habit_entries")
    .select(`
      *,
      habit:habits(
        id,
        user_id,
        habit_shares(
          partnership_id,
          can_verify,
          partnership:partnerships(
            id,
            requester_id,
            partner_id,
            status
          )
        )
      )
    `)
    .eq("id", entryId)
    .single();

  if (!entry) {
    throw new Error("Entry not found");
  }

  // Check if user has permission to verify this entry
  const habit = entry.habit as {
    id: string;
    user_id: string;
    habit_shares: Array<{
      can_verify: boolean;
      partnership: {
        id: string;
        requester_id: string;
        partner_id: string;
        status: string;
      };
    }>;
  };

  const canVerify = habit.habit_shares?.some(share => {
    if (!share.can_verify || share.partnership.status !== "active") return false;
    // User must be the partner (not the habit owner)
    return (
      (share.partnership.requester_id === habit.user_id && share.partnership.partner_id === user.id) ||
      (share.partnership.partner_id === habit.user_id && share.partnership.requester_id === user.id)
    );
  });

  if (!canVerify) {
    throw new Error("You don't have permission to verify this entry");
  }

  // Update the entry with verification
  const { error } = await supabase
    .from("habit_entries")
    .update({
      partner_verified: true,
      partner_verified_at: new Date().toISOString(),
      partner_verified_by: user.id,
    })
    .eq("id", entryId);

  if (error) {
    console.error("Error verifying entry:", error);
    throw new Error(error.message);
  }

  revalidatePath("/partners");
}

export async function unverifyPartnerEntry(entryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Only the user who verified can unverify
  const { error } = await supabase
    .from("habit_entries")
    .update({
      partner_verified: false,
      partner_verified_at: null,
      partner_verified_by: null,
    })
    .eq("id", entryId)
    .eq("partner_verified_by", user.id);

  if (error) {
    console.error("Error unverifying entry:", error);
    throw new Error(error.message);
  }

  revalidatePath("/partners");
}

export async function sendNudge(
  partnerId: string,
  partnershipId: string,
  habitId?: string,
  message?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("nudges").insert({
    from_user_id: user.id,
    to_user_id: partnerId,
    partnership_id: partnershipId,
    habit_id: habitId || null,
    message: message || null,
  });

  if (error) {
    console.error("Error sending nudge:", error);
    throw new Error(error.message);
  }

  revalidatePath("/partners");
  revalidatePath("/");
}

export async function markNudgeAsRead(nudgeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("nudges")
    .update({ read_at: new Date().toISOString() })
    .eq("id", nudgeId)
    .eq("to_user_id", user.id);

  if (error) {
    console.error("Error marking nudge as read:", error);
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function markAllNudgesAsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("nudges")
    .update({ read_at: new Date().toISOString() })
    .eq("to_user_id", user.id)
    .is("read_at", null);

  if (error) {
    console.error("Error marking nudges as read:", error);
    throw new Error(error.message);
  }

  revalidatePath("/");
}
