import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  const user = {
    id: data.user.id,
    email: data.user.email ?? "",
    displayName: profile?.display_name ?? data.user.email?.split("@")[0] ?? "User",
    avatarUrl: profile?.avatar_url,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="pb-20 md:pb-6">{children}</main>
      <MobileNav />
    </div>
  );
}
