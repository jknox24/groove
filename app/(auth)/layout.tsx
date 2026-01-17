import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // Redirect to dashboard if already logged in
  if (data.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Groove</h1>
          <p className="text-text-secondary text-sm mt-1">
            Build better habits
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
