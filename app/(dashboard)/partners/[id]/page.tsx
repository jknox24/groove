import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Share2, Eye, Activity, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitShareToggle } from "./habit-share-toggle";
import { PartnerHabitCard } from "./partner-habit-card";
import { NudgeButton } from "./nudge-button";
import { ActivityFeed } from "@/components/partners/activity-feed";
import { PartnerComparison } from "@/components/partners/partner-comparison";

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

  // Build activity feed from partner's completed entries (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  type HabitEntry = {
    id: string;
    entry_date: string;
    completed: boolean;
    value: number | null;
    photo_url: string | null;
    partner_verified: boolean | null;
    partner_verified_at: string | null;
    partner_verified_by: string | null;
  };

  const activities = partnerHabitsWithEntries
    .flatMap(share => {
      const habit = share.habit;
      return habit.habit_entries
        .filter((entry: HabitEntry) => entry.completed && entry.entry_date >= sevenDaysAgoStr)
        .map((entry: HabitEntry) => {
          // Calculate streak for this habit at this entry
          const sortedEntries = [...habit.habit_entries]
            .filter((e: HabitEntry) => e.completed)
            .sort((a: HabitEntry, b: HabitEntry) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

          let streak = 0;
          let checkDate = entry.entry_date;
          for (const e of sortedEntries) {
            if (e.entry_date === checkDate) {
              streak++;
              const d = new Date(checkDate);
              d.setDate(d.getDate() - 1);
              checkDate = d.toISOString().split("T")[0];
            } else if (e.entry_date < checkDate) {
              break;
            }
          }

          return {
            id: `${entry.id}-${habit.id}`,
            partnerId,
            partnerName: partner.display_name || partner.username || "Partner",
            partnerAvatar: partner.avatar_url,
            habitName: habit.name,
            habitIcon: habit.icon || "✅",
            habitColor: habit.color || "#6366f1",
            streak,
            completedAt: entry.entry_date,
            entryId: entry.id,
          };
        });
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 20); // Limit to 20 most recent

  // Calculate week date range for comparison
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  // Get user's own entries for comparison
  const { data: userEntries } = await supabase
    .from("habit_entries")
    .select("*, habit:habits(*)")
    .eq("user_id", user.id)
    .gte("entry_date", weekStartStr);

  // Calculate user stats
  const userCompletedThisWeek = (userEntries || []).filter(e => e.completed).length;
  const userHabitCount = habits?.length || 0;
  const userMaxPossible = userHabitCount * 7;
  const userWeeklyRate = userMaxPossible > 0 ? Math.round((userCompletedThisWeek / userMaxPossible) * 100) : 0;

  // Calculate user's best streak across all habits
  const { data: allUserEntries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  let userBestStreak = 0;
  (habits || []).forEach(habit => {
    const habitEntries = (allUserEntries || [])
      .filter(e => e.habit_id === habit.id && e.completed)
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = today;

    for (const entry of habitEntries) {
      if (entry.entry_date === checkDate) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else if (entry.entry_date < checkDate) {
        break;
      }
    }
    if (streak > userBestStreak) userBestStreak = streak;
  });

  // Calculate partner stats from shared habits
  const partnerCompletedThisWeek = partnerHabitsWithEntries
    .flatMap(s => s.habit.habit_entries)
    .filter(e => e.completed && e.entry_date >= weekStartStr).length;
  const partnerHabitCount = partnerHabitsWithEntries.length;
  const partnerMaxPossible = partnerHabitCount * 7;
  const partnerWeeklyRate = partnerMaxPossible > 0 ? Math.round((partnerCompletedThisWeek / partnerMaxPossible) * 100) : 0;

  // Calculate partner's best streak
  let partnerBestStreak = 0;
  partnerHabitsWithEntries.forEach(share => {
    const habitEntries = share.habit.habit_entries
      .filter((e: HabitEntry) => e.completed)
      .sort((a: HabitEntry, b: HabitEntry) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = today;

    for (const entry of habitEntries) {
      if (entry.entry_date === checkDate) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else if (entry.entry_date < checkDate) {
        break;
      }
    }
    if (streak > partnerBestStreak) partnerBestStreak = streak;
  });

  const yourStats = {
    weeklyCompletionRate: userWeeklyRate,
    currentStreak: userBestStreak,
    totalCompletions: userCompletedThisWeek,
  };

  const partnerStatsData = {
    partnerId,
    partnerName: partner.display_name || partner.username || "Partner",
    partnerAvatar: partner.avatar_url,
    weeklyCompletionRate: partnerWeeklyRate,
    currentStreak: partnerBestStreak,
    totalCompletions: partnerCompletedThisWeek,
    sharedHabitsCount: partnerHabitCount,
  };

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

      {/* Comparison View */}
      {partnerHabitsWithEntries.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Weekly Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PartnerComparison yourStats={yourStats} partnerStats={partnerStatsData} />
          </CardContent>
        </Card>
      )}

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

      {/* Activity Feed */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Recent Activity ({activities.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <ActivityFeed activities={activities} currentUserId={user.id} />
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </CardContent>
      </Card>

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
