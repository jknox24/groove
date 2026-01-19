import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgressCard } from "@/components/share/progress-card";
import { ShareToPartners } from "@/components/share/share-to-partners";
import { PublicProfileLink } from "@/components/share/public-profile-link";
import Link from "next/link";
import { ArrowLeft, Users, Globe } from "lucide-react";

export default async function ShareProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get habits
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("sort_order");

  // Get the start and end of the current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  // Get entries for this week
  const { data: entries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("entry_date", weekStartStr)
    .lte("entry_date", weekEndStr);

  // Calculate streaks for each habit
  const { data: allEntries } = await supabase
    .from("habit_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  const streaks: Record<string, number> = {};
  (habits || []).forEach((habit) => {
    const habitEntries = (allEntries || [])
      .filter((e) => e.habit_id === habit.id)
      .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = today;

    for (const entry of habitEntries) {
      if (entry.entry_date === checkDate && entry.completed) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else if (entry.entry_date < checkDate) {
        break;
      }
    }
    streaks[habit.id] = streak;
  });

  // Get active partners
  const { data: partnerships } = await supabase
    .from("partnerships")
    .select(`
      *,
      requester:profiles!partnerships_requester_id_fkey(*),
      partner:profiles!partnerships_partner_id_fkey(*)
    `)
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
    .eq("status", "active");

  const partners = (partnerships || []).map((p) => {
    const isRequester = p.requester_id === user.id;
    const partnerProfile = isRequester ? p.partner : p.requester;
    return {
      partnershipId: p.id,
      partnerId: partnerProfile.id,
      displayName: partnerProfile.display_name || "Partner",
      avatarUrl: partnerProfile.avatar_url,
    };
  });

  const userName = profile?.display_name || user.email?.split("@")[0] || "User";

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/partners"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Partners
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Share Progress
        </h1>
        <p className="text-gray-500 mt-1">
          Share your weekly progress with partners or on social media
        </p>
      </div>

      {/* Progress Card */}
      <div className="mb-8">
        <ProgressCard
          userName={userName}
          habits={habits || []}
          entries={entries || []}
          streaks={streaks}
          weekStart={weekStartStr}
          weekEnd={weekEndStr}
        />
      </div>

      {/* Share to Partners */}
      {partners.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Send to Partners
            </h2>
          </div>
          <ShareToPartners
            partners={partners}
            completionRate={
              habits && habits.length > 0
                ? Math.round(
                    ((entries || []).filter((e) => e.completed).length /
                      (habits.length * 7)) *
                      100
                  )
                : 0
            }
          />
        </div>
      )}

      {/* No Partners */}
      {partners.length === 0 && (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            No partners yet
          </p>
          <Link
            href="/partners"
            className="text-primary text-sm hover:underline"
          >
            Add a partner to share progress
          </Link>
        </div>
      )}

      {/* Public Profile Link */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Publicly
          </h2>
        </div>
        <PublicProfileLink username={profile?.username} />
      </div>
    </div>
  );
}
