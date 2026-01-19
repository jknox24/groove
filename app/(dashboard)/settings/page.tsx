import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Preferences } from "@/components/settings/preferences";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { SeedDemoButton } from "@/components/settings/seed-demo-button";
import { Trophy, ChevronRight, FlaskConical } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-text mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Achievements Link */}
        <Link href="/achievements">
          <Card className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Achievements</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View your badges and progress</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        {/* Preferences */}
        <Preferences />

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary">Name</p>
              <p className="font-medium">
                {profile?.display_name ?? "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Timezone</p>
              <p className="font-medium">
                {profile?.timezone ?? "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={logout}>
              <Button variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Data Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-violet-500" />
              <CardTitle>Demo Data</CardTitle>
            </div>
            <CardDescription>
              Add fake data to test partner features like activity feed, comparison, and cheering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeedDemoButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
