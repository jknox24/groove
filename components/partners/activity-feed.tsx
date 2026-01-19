"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Flame, Check, Heart, PartyPopper, ThumbsUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendCheer } from "@/app/(dashboard)/partners/actions";

interface ActivityItem {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  habitName: string;
  habitIcon: string;
  habitColor: string;
  streak: number;
  completedAt: string;
  entryId: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  currentUserId: string;
}

const REACTIONS = [
  { emoji: "🎉", icon: PartyPopper },
  { emoji: "👏", icon: ThumbsUp },
  { emoji: "❤️", icon: Heart },
  { emoji: "✨", icon: Sparkles },
];

export function ActivityFeed({ activities, currentUserId }: ActivityFeedProps) {
  const [cheeredEntries, setCheeredEntries] = useState<Set<string>>(new Set());
  const [sendingCheer, setSendingCheer] = useState<string | null>(null);

  const handleCheer = async (activity: ActivityItem, emoji: string) => {
    if (cheeredEntries.has(activity.entryId)) return;
    setSendingCheer(activity.entryId);

    try {
      await sendCheer(activity.partnerId, activity.habitName, emoji);
      setCheeredEntries(new Set([...cheeredEntries, activity.entryId]));
    } catch (error) {
      console.error("Failed to send cheer:", error);
    }

    setSendingCheer(null);
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent activity from partners</p>
        <p className="text-sm mt-1">Activities will appear when partners complete shared habits</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const hasCheered = cheeredEntries.has(activity.entryId);
        const isSending = sendingCheer === activity.entryId;

        return (
          <div
            key={activity.id}
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              {activity.partnerAvatar ? (
                <img
                  src={activity.partnerAvatar}
                  alt={activity.partnerName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {activity.partnerName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {activity.partnerName}
                  </span>
                  <span className="text-gray-500">completed</span>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: `${activity.habitColor}15`,
                      color: activity.habitColor,
                    }}
                  >
                    <span>{activity.habitIcon}</span>
                    <span>{activity.habitName}</span>
                  </span>
                </div>

                {/* Streak Badge */}
                {activity.streak > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-orange-600">
                    <Flame className="w-4 h-4" />
                    <span>{activity.streak} day streak!</span>
                  </div>
                )}

                {/* Time */}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.completedAt), { addSuffix: true })}
                </p>

                {/* Reactions */}
                <div className="flex items-center gap-2 mt-3">
                  {hasCheered ? (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      <span>Cheered!</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-gray-400 mr-1">Send cheer:</span>
                      {REACTIONS.map(({ emoji }) => (
                        <button
                          key={emoji}
                          onClick={() => handleCheer(activity, emoji)}
                          disabled={isSending}
                          className={cn(
                            "w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-110",
                            isSending && "opacity-50"
                          )}
                        >
                          <span className="text-base">{emoji}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
