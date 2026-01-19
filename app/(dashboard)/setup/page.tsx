import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetupForm } from "@/components/onboarding/setup-form";

export default async function SetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has habits
  const { data: habits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .limit(1);

  // If user already has habits, redirect to dashboard
  if (habits && habits.length > 0) {
    redirect("/");
  }

  return <SetupForm />;
}
