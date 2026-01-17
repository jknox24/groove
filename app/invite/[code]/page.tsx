import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPartnershipRequest } from "@/app/(dashboard)/partners/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

async function decodeInvite(code: string) {
  try {
    const decoded = Buffer.from(code, "base64url").toString();
    return JSON.parse(decoded) as {
      from: string;
      code: string;
      name: string;
    };
  } catch {
    return null;
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const inviteData = await decodeInvite(code);

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-error mb-4">Invalid or expired invite link.</p>
            <Link href="/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, redirect to login with return URL
  if (!user) {
    redirect(`/login?redirect=/invite/${code}`);
  }

  // Check if trying to partner with self
  if (user.id === inviteData.from) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-text-secondary mb-4">You can't partner with yourself!</p>
            <Link href="/partners">
              <Button>Go to Partners</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if partnership already exists
  const { data: existing } = await supabase
    .from("partnerships")
    .select("*, requester:profiles!partnerships_requester_id_fkey(display_name, username)")
    .or(`and(requester_id.eq.${inviteData.from},partner_id.eq.${user.id}),and(requester_id.eq.${user.id},partner_id.eq.${inviteData.from})`)
    .not("status", "in", "(declined,ended)")
    .single();

  if (existing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-text-secondary mb-4">
              {existing.status === "active"
                ? "You're already partners!"
                : "A partnership request is already pending."}
            </p>
            <Link href="/partners">
              <Button>Go to Partners</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get inviter's profile
  const { data: inviter } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("id", inviteData.from)
    .single();

  // Safely get inviter name with fallbacks
  const inviterName = inviter?.display_name ?? inviter?.username ?? inviteData.name ?? "Someone";

  // Server action to accept invite
  async function acceptInvite() {
    "use server";
    const result = await createPartnershipRequest(inviteData!.from);
    if (result.error) {
      // In a real app, you'd handle this error better
      console.error("Error accepting invite:", result.error);
    }
    redirect("/partners");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Partner Invitation</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-text-secondary">
            <span className="font-medium text-text">{inviterName}</span> wants to be your accountability partner on Groove.
          </p>
          <p className="text-sm text-text-muted">
            As partners, you can share habits, verify each other's progress, and send encouraging nudges.
          </p>
          <div className="flex gap-3 pt-4">
            <Link href="/partners" className="flex-1">
              <Button variant="outline" className="w-full">
                Decline
              </Button>
            </Link>
            <form action={acceptInvite} className="flex-1">
              <Button type="submit" className="w-full">
                Accept
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
