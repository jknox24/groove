"use client";

import { Trophy, TrendingUp, TrendingDown, Minus, Flame, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerStats {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  weeklyCompletionRate: number;
  currentStreak: number;
  totalCompletions: number;
  sharedHabitsCount: number;
}

interface PartnerComparisonProps {
  yourStats: {
    weeklyCompletionRate: number;
    currentStreak: number;
    totalCompletions: number;
  };
  partnerStats: PartnerStats;
}

export function PartnerComparison({ yourStats, partnerStats }: PartnerComparisonProps) {
  const getComparisonIcon = (yours: number, theirs: number) => {
    if (yours > theirs) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (yours < theirs) return <TrendingDown className="w-4 h-4 text-orange-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getWinner = () => {
    let yourScore = 0;
    let theirScore = 0;

    if (yourStats.weeklyCompletionRate > partnerStats.weeklyCompletionRate) yourScore++;
    else if (yourStats.weeklyCompletionRate < partnerStats.weeklyCompletionRate) theirScore++;

    if (yourStats.currentStreak > partnerStats.currentStreak) yourScore++;
    else if (yourStats.currentStreak < partnerStats.currentStreak) theirScore++;

    if (yourStats.totalCompletions > partnerStats.totalCompletions) yourScore++;
    else if (yourStats.totalCompletions < partnerStats.totalCompletions) theirScore++;

    if (yourScore > theirScore) return "you";
    if (theirScore > yourScore) return "partner";
    return "tie";
  };

  const winner = getWinner();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header with avatars */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary ring-2",
            winner === "you" ? "ring-yellow-400" : "ring-transparent"
          )}>
            You
          </div>
          {winner === "you" && (
            <Trophy className="w-5 h-5 text-yellow-500" />
          )}
        </div>

        <span className="text-sm font-medium text-gray-500">vs</span>

        <div className="flex items-center gap-3">
          {winner === "partner" && (
            <Trophy className="w-5 h-5 text-yellow-500" />
          )}
          {partnerStats.partnerAvatar ? (
            <img
              src={partnerStats.partnerAvatar}
              alt={partnerStats.partnerName}
              className={cn(
                "w-12 h-12 rounded-full object-cover ring-2",
                winner === "partner" ? "ring-yellow-400" : "ring-transparent"
              )}
            />
          ) : (
            <div className={cn(
              "w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-semibold text-emerald-600 ring-2",
              winner === "partner" ? "ring-yellow-400" : "ring-transparent"
            )}>
              {getInitials(partnerStats.partnerName)}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Stats */}
      <div className="space-y-4">
        {/* Weekly Completion Rate */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Weekly Completion
            </span>
            {getComparisonIcon(yourStats.weeklyCompletionRate, partnerStats.weeklyCompletionRate)}
          </div>
          <div className="flex items-end justify-between">
            <div className="text-center">
              <span className={cn(
                "text-2xl font-bold",
                yourStats.weeklyCompletionRate >= partnerStats.weeklyCompletionRate
                  ? "text-green-600"
                  : "text-gray-900 dark:text-white"
              )}>
                {yourStats.weeklyCompletionRate}%
              </span>
              <p className="text-xs text-gray-500">You</p>
            </div>

            {/* Progress bar visualization */}
            <div className="flex-1 mx-4 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
              <div
                className="absolute left-0 h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(yourStats.weeklyCompletionRate, 100) / 2}%` }}
              />
              <div
                className="absolute right-0 h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(partnerStats.weeklyCompletionRate, 100) / 2}%` }}
              />
            </div>

            <div className="text-center">
              <span className={cn(
                "text-2xl font-bold",
                partnerStats.weeklyCompletionRate > yourStats.weeklyCompletionRate
                  ? "text-emerald-600"
                  : "text-gray-900 dark:text-white"
              )}>
                {partnerStats.weeklyCompletionRate}%
              </span>
              <p className="text-xs text-gray-500">{partnerStats.partnerName.split(" ")[0]}</p>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Current Streak
            </span>
            {getComparisonIcon(yourStats.currentStreak, partnerStats.currentStreak)}
          </div>
          <div className="flex items-end justify-between">
            <div className="text-center">
              <span className={cn(
                "text-2xl font-bold",
                yourStats.currentStreak >= partnerStats.currentStreak
                  ? "text-orange-500"
                  : "text-gray-900 dark:text-white"
              )}>
                {yourStats.currentStreak}
              </span>
              <p className="text-xs text-gray-500">days</p>
            </div>

            <div className="flex-1 mx-4 flex items-center justify-center gap-1">
              {Array.from({ length: Math.max(yourStats.currentStreak, partnerStats.currentStreak, 7) }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full",
                    i < yourStats.currentStreak && i < partnerStats.currentStreak
                      ? "bg-yellow-400"
                      : i < yourStats.currentStreak
                      ? "bg-primary"
                      : i < partnerStats.currentStreak
                      ? "bg-emerald-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              ))}
            </div>

            <div className="text-center">
              <span className={cn(
                "text-2xl font-bold",
                partnerStats.currentStreak > yourStats.currentStreak
                  ? "text-orange-500"
                  : "text-gray-900 dark:text-white"
              )}>
                {partnerStats.currentStreak}
              </span>
              <p className="text-xs text-gray-500">days</p>
            </div>
          </div>
        </div>

        {/* Total Completions (this week) */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Check-ins This Week
            </span>
            {getComparisonIcon(yourStats.totalCompletions, partnerStats.totalCompletions)}
          </div>
          <div className="flex items-end justify-between">
            <div className="text-center">
              <span className={cn(
                "text-2xl font-bold",
                yourStats.totalCompletions >= partnerStats.totalCompletions
                  ? "text-primary"
                  : "text-gray-900 dark:text-white"
              )}>
                {yourStats.totalCompletions}
              </span>
              <p className="text-xs text-gray-500">You</p>
            </div>

            <div className="flex-1 mx-4 text-center">
              <span className="text-lg font-semibold text-gray-400">
                {Math.abs(yourStats.totalCompletions - partnerStats.totalCompletions)}
              </span>
              <p className="text-xs text-gray-500">difference</p>
            </div>

            <div className="text-center">
              <span className={cn(
                "text-2xl font-bold",
                partnerStats.totalCompletions > yourStats.totalCompletions
                  ? "text-emerald-600"
                  : "text-gray-900 dark:text-white"
              )}>
                {partnerStats.totalCompletions}
              </span>
              <p className="text-xs text-gray-500">{partnerStats.partnerName.split(" ")[0]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Winner announcement */}
      {winner !== "tie" && (
        <div className={cn(
          "text-center py-3 rounded-xl",
          winner === "you"
            ? "bg-primary/10 text-primary"
            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
        )}>
          <p className="text-sm font-medium">
            {winner === "you"
              ? "🎉 You're ahead this week! Keep it up!"
              : `👀 ${partnerStats.partnerName.split(" ")[0]} is ahead - time to catch up!`}
          </p>
        </div>
      )}

      {winner === "tie" && (
        <div className="text-center py-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
          <p className="text-sm font-medium">
            🤝 It&apos;s a tie! You&apos;re both doing great!
          </p>
        </div>
      )}
    </div>
  );
}
