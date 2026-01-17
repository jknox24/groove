"use client";

import { useState, useTransition } from "react";
import { Bell, X } from "lucide-react";
import { markAllNudgesAsRead } from "@/app/(dashboard)/partners/actions";

interface Nudge {
  id: string;
  message: string | null;
  created_at: string;
  from_user: {
    id: string;
    display_name: string | null;
    username: string | null;
  };
}

interface NudgeBannerProps {
  nudges: Nudge[];
}

export function NudgeBanner({ nudges: initialNudges }: NudgeBannerProps) {
  const [nudges, setNudges] = useState(initialNudges);
  const [isPending, startTransition] = useTransition();

  if (nudges.length === 0) {
    return null;
  }

  function handleDismiss() {
    startTransition(async () => {
      await markAllNudgesAsRead();
      setNudges([]);
    });
  }

  const latestNudge = nudges[0];
  const senderName = latestNudge.from_user.display_name || latestNudge.from_user.username || "Partner";

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text">
            {senderName} sent you a nudge{nudges.length > 1 ? ` (+${nudges.length - 1} more)` : ""}
          </p>
          {latestNudge.message && (
            <p className="text-sm text-text-secondary mt-1">
              "{latestNudge.message}"
            </p>
          )}
          <p className="text-xs text-text-muted mt-1">
            {new Date(latestNudge.created_at).toLocaleDateString("en-US", {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="p-1 hover:bg-background rounded transition-colors"
        >
          <X className="w-4 h-4 text-text-muted" />
        </button>
      </div>
    </div>
  );
}
