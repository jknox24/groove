import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WaitlistForm } from "./waitlist-form";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, go to dashboard
  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg text-primary">Groove</span>
          <Link
            href="/login"
            className="text-sm font-medium text-text-secondary hover:text-text transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="pt-14">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Coming soon
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text leading-tight mb-6">
            Build habits that
            <span className="text-primary"> actually stick</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto mb-10">
            Track your progress, get accountability from real partners, and use AI insights to understand your patterns. No more guessing.
          </p>

          {/* Waitlist Form */}
          <WaitlistForm />

          {/* Social proof */}
          <p className="mt-6 text-sm text-text-muted">
            Join 100+ people on the waitlist
          </p>
        </div>

        {/* Features Preview */}
        <div className="max-w-4xl mx-auto px-4 pb-24">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-surface border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl mb-4">
                ✓
              </div>
              <h3 className="font-semibold text-text mb-2">Simple Check-ins</h3>
              <p className="text-sm text-text-secondary">
                One tap to mark complete. Confetti included.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-surface border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl mb-4">
                👥
              </div>
              <h3 className="font-semibold text-text mb-2">Real Accountability</h3>
              <p className="text-sm text-text-secondary">
                Partner with friends who can verify your progress and send nudges.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-surface border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl mb-4">
                ✨
              </div>
              <h3 className="font-semibold text-text mb-2">AI Insights</h3>
              <p className="text-sm text-text-secondary">
                Understand your patterns with personalized analysis.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-text-muted">
          Built with care. More features coming soon.
        </div>
      </footer>
    </div>
  );
}
