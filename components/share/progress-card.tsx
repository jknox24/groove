"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2, Flame, Trophy, Target, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Habit, HabitEntry } from "@/types";

interface ProgressCardProps {
  userName: string;
  habits: Habit[];
  entries: HabitEntry[];
  streaks: Record<string, number>;
  weekStart: string;
  weekEnd: string;
}

export function ProgressCard({
  userName,
  habits,
  entries,
  streaks,
  weekStart,
  weekEnd,
}: ProgressCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Calculate stats
  const totalPossible = habits.length * 7;
  const completedThisWeek = entries.filter((e) => e.completed).length;
  const completionRate = totalPossible > 0
    ? Math.round((completedThisWeek / totalPossible) * 100)
    : 0;

  const bestStreak = Math.max(...Object.values(streaks), 0);
  const totalStreaks = Object.values(streaks).filter((s) => s > 0).length;

  // Per-habit completion this week
  const habitStats = habits.map((habit) => {
    const habitEntries = entries.filter((e) => e.habit_id === habit.id);
    const completed = habitEntries.filter((e) => e.completed).length;
    return {
      habit,
      completed,
      streak: streaks[habit.id] || 0,
    };
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `groove-progress-${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download:", err);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "groove-progress.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "My Groove Progress",
          text: `Check out my habit progress! ${completionRate}% completion this week 🔥`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "My Groove Progress",
          text: `Check out my habit progress! ${completionRate}% completion this week 🔥`,
        });
      } else {
        // Fallback to download
        handleDownload();
      }
    } catch (err) {
      console.error("Failed to share:", err);
    }
    setSharing(false);
  };

  return (
    <div className="space-y-4">
      {/* The Card */}
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 text-white overflow-hidden relative"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-emerald-200 text-sm font-medium">Weekly Progress</p>
              <p className="text-white/60 text-xs">
                {formatDate(weekStart)} - {formatDate(weekEnd)}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Groove</span>
            </div>
          </div>

          {/* User & Main Stat */}
          <div className="mb-6">
            <p className="text-lg font-semibold mb-1">{userName}</p>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold">{completionRate}%</span>
              <span className="text-emerald-200 text-lg mb-2">complete</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/10 rounded-2xl p-3 text-center">
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-400" />
              <p className="text-2xl font-bold">{bestStreak}</p>
              <p className="text-xs text-white/60">Best Streak</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <p className="text-2xl font-bold">{completedThisWeek}</p>
              <p className="text-xs text-white/60">Check-ins</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-bold">{totalStreaks}</p>
              <p className="text-xs text-white/60">Active Streaks</p>
            </div>
          </div>

          {/* Habits */}
          <div className="space-y-2">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-2">This Week</p>
            <div className="grid grid-cols-2 gap-2">
              {habitStats.slice(0, 6).map(({ habit, completed, streak }) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2"
                >
                  <span className="text-lg">{habit.icon || "✨"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{habit.name}</p>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{completed}/7</span>
                      {streak > 0 && (
                        <span className="flex items-center gap-0.5 text-orange-400">
                          <Flame className="w-3 h-3" />
                          {streak}
                        </span>
                      )}
                    </div>
                  </div>
                  {completed === 7 && (
                    <Check className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              ))}
            </div>
            {habits.length > 6 && (
              <p className="text-xs text-white/40 text-center">
                +{habits.length - 6} more habits
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-xs text-white/40">Built with Groove</p>
            <p className="text-xs text-white/40">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          variant="outline"
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          {downloading ? "Saving..." : "Save Image"}
        </Button>
        <Button
          onClick={handleShare}
          disabled={sharing}
          className="flex-1"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {sharing ? "Sharing..." : "Share"}
        </Button>
      </div>
    </div>
  );
}
