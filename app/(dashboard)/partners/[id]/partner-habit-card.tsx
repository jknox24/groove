"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, ShieldCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyPartnerEntry, unverifyPartnerEntry } from "../actions";

interface HabitEntry {
  id: string;
  entry_date: string;
  completed: boolean;
  value: number | null;
  photo_url: string | null;
  partner_verified: boolean | null;
  partner_verified_at: string | null;
  partner_verified_by: string | null;
}

interface PartnerHabitCardProps {
  habit: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    tracking_type: string;
    target_value: number | null;
    target_unit: string | null;
    habit_entries: HabitEntry[];
  };
  canVerify: boolean;
}

export function PartnerHabitCard({ habit, canVerify }: PartnerHabitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sort entries by date descending and take last 7
  const recentEntries = [...(habit.habit_entries || [])]
    .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    .slice(0, 7);

  const completedCount = recentEntries.filter(e => e.completed).length;
  const verifiedCount = recentEntries.filter(e => e.partner_verified).length;

  function handleVerify(entryId: string, currentlyVerified: boolean) {
    startTransition(async () => {
      if (currentlyVerified) {
        await unverifyPartnerEntry(entryId);
      } else {
        await verifyPartnerEntry(entryId);
      }
    });
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-background/50 transition-colors"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${habit.color}15` }}
        >
          {habit.icon}
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium">{habit.name}</p>
          <p className="text-xs text-text-muted">
            {completedCount}/{recentEntries.length} completed this week
            {verifiedCount > 0 && ` · ${verifiedCount} verified`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {/* Entries */}
      {expanded && (
        <div className="border-t border-border">
          {recentEntries.length === 0 ? (
            <p className="p-3 text-sm text-text-muted">No entries yet</p>
          ) : (
            <div className="divide-y divide-border">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 ${isPending ? "opacity-50" : ""}`}
                >
                  {/* Status indicator */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      entry.completed
                        ? "bg-primary text-white"
                        : "bg-border-subtle text-text-muted"
                    }`}
                  >
                    {entry.completed ? "✓" : "–"}
                  </div>

                  {/* Date and value */}
                  <div className="flex-1">
                    <p className="text-sm">
                      {new Date(entry.entry_date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {entry.value && (
                      <p className="text-xs text-text-muted">
                        {entry.value}
                        {habit.target_unit && ` ${habit.target_unit}`}
                      </p>
                    )}
                  </div>

                  {/* Photo proof */}
                  {entry.photo_url && (
                    <a
                      href={entry.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded overflow-hidden border border-border hover:border-primary"
                    >
                      <img
                        src={entry.photo_url}
                        alt="Proof"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  )}

                  {/* Verification badge/button */}
                  {entry.partner_verified ? (
                    <div className="flex items-center gap-1 text-primary">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs">Verified</span>
                    </div>
                  ) : canVerify && entry.completed ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerify(entry.id, false)}
                      disabled={isPending}
                      className="text-xs"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Verify
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
