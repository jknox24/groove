import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Share2, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitShareToggle } from "./habit-share-toggle";
import { PartnerHabitCard } from "./partner-habit-card";
import { NudgeButton } from "./nudge-button";

interface PartnerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const { id: partnerId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Find the partnership (user could be requester or partner)
  const { data: partnership } = await supabase
    .from("partnerships")
    .select("*")
    .eq("status", "active")
    .or(`and(requester_id.eq.${user.id},partner_id.eq.${partnerId}),and(requester_id.eq.${partnerId},partner_id.eq.${user.id})`)
    .single();

  if (!partnership) {
    notFound();
  }

  // Get partner's profile
  const { data: partner } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", partnerId)
    .single();

  if (!partner) {
    notFound();
  }

  // Get user's habits
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("sort_order");

  // Get existing shares for this partnership (user's habits shared with partner)
  const { data: shares } = await supabase
    .from("habit_shares")
    .select("*")
    .eq("partnership_id", partnership.id);

  const sharesMap = new Map(shares?.map(s => [s.habit_id, s]) ?? []);

  // Get partner's shared habits with recent entries
  const { data: partnerShares } = await supabase
    .from("habit_shares")
    .select(`
      *,
      habit:habits(
        *,
        habit_entries(
          id,
          entry_date,
          completed,
          value,
          photo_url,
          partner_verified,
          partner_verified_at,
          partner_verified_by
        )
      )
    `)
    .eq("partnership_id", partnership.id);

  // Filter to only partner's habits (not our own)
  const partnerHabitsWithEntries = partnerShares
    ?.filter(share => {
      const habit = share.habit as { user_id: string } | null;
      return habit && habit.user_id === partnerId;
    })
    .map(share => ({
      ...share,
      habit: share.habit as {
        id: string;
        name: string;
        icon: string | null;
        color: string | null;
        user_id: string;
        tracking_type: string;
        target_value: number | null;
        target_unit: string | null;
        habit_entries: Array<{
          id: string;
          entry_date: string;
          completed: boolean;
          value: number | null;
          photo_url: string | null;
          partner_verified: boolean | null;
          partner_verified_at: string | null;
          partner_verified_by: string | null;
        }>;
      },
    })) ?? [];

  const partnerName = partner.display_name || partner.username || "Partner";
  const initials = partnerName.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/partners"
          className="inline-flex items-center text-sm text-text-secondary hover:text-text mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Partners
        </Link>

        <div className="flex items-center gap-4">
          {partner.avatar_url ? (
            <img
              src={partner.avatar_url}
              alt={partnerName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-medium">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text">{partnerName}</h1>
            <p className="text-text-secondary">Accountability Partner</p>
          </div>
          <NudgeButton
            partnerId={partnerId}
            partnershipId={partnership.id}
            partnerName={partnerName}
          />
        </div>
      </div>

      {/* Partner's Shared Habits with Entries */}
      {partnerHabitsWithEntries.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {partnerName}&apos;s Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {partnerHabitsWithEntries.map((share) => (
              <PartnerHabitCard
                key={share.id}
                habit={share.habit}
                canVerify={share.can_verify}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Share Your Habits */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share Your Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {habits && habits.length > 0 ? (
            <div className="space-y-3">
              {habits.map((habit) => {
                const share = sharesMap.get(habit.id);
                return (
                  <HabitShareToggle
                    key={habit.id}
                    habit={habit}
                    partnershipId={partnership.id}
                    isShared={!!share}
                    canVerify={share?.can_verify ?? false}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              You don&apos;t have any habits yet.{" "}
              <Link href="/habits/new" className="text-primary hover:underline">
                Create one
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
