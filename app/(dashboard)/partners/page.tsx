import { createClient } from "@/lib/supabase/server";
import { PartnersClient } from "./partners-client";

export default async function PartnersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch partnerships where user is requester
  const { data: outgoing } = await supabase
    .from("partnerships")
    .select(`
      id,
      status,
      created_at,
      partner:profiles!partnerships_partner_id_fkey(
        id,
        display_name,
        username,
        avatar_url
      )
    `)
    .eq("requester_id", user.id)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });

  // Fetch partnerships where user is partner
  const { data: incoming } = await supabase
    .from("partnerships")
    .select(`
      id,
      status,
      created_at,
      requester:profiles!partnerships_requester_id_fkey(
        id,
        display_name,
        username,
        avatar_url
      )
    `)
    .eq("partner_id", user.id)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });

  // Get habit share counts for active partnerships
  const activePartnershipIds = [
    ...(outgoing?.filter(p => p.status === "active").map(p => p.id) ?? []),
    ...(incoming?.filter(p => p.status === "active").map(p => p.id) ?? []),
  ];

  const { data: shareCounts } = activePartnershipIds.length > 0
    ? await supabase
        .from("habit_shares")
        .select("partnership_id")
        .in("partnership_id", activePartnershipIds)
    : { data: [] };

  const shareCountMap = new Map<string, number>();
  shareCounts?.forEach(share => {
    const current = shareCountMap.get(share.partnership_id) ?? 0;
    shareCountMap.set(share.partnership_id, current + 1);
  });

  // Transform data for client
  type PartnerProfile = {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };

  const partnerships = [
    ...(outgoing?.map(p => {
      const partner = Array.isArray(p.partner) ? p.partner[0] : p.partner;
      return {
        id: p.id,
        partner: partner as PartnerProfile,
        status: p.status as "pending" | "active",
        isIncoming: false,
        sharedHabitsCount: shareCountMap.get(p.id) ?? 0,
      };
    }) ?? []),
    ...(incoming?.map(p => {
      const requester = Array.isArray(p.requester) ? p.requester[0] : p.requester;
      return {
        id: p.id,
        partner: requester as PartnerProfile,
        status: p.status as "pending" | "active",
        isIncoming: true,
        sharedHabitsCount: shareCountMap.get(p.id) ?? 0,
      };
    }) ?? []),
  ];

  // Separate pending incoming (requests to respond to) from others
  const pendingIncoming = partnerships.filter(p => p.status === "pending" && p.isIncoming);
  const activePartners = partnerships.filter(p => p.status === "active");
  const pendingOutgoing = partnerships.filter(p => p.status === "pending" && !p.isIncoming);

  return (
    <PartnersClient
      pendingIncoming={pendingIncoming}
      activePartners={activePartners}
      pendingOutgoing={pendingOutgoing}
    />
  );
}
