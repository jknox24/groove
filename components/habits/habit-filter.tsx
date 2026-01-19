"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimeOfDay } from "@/types";

type StatusFilter = "all" | "unmet" | "met";

interface HabitFilterProps {
  onFilterChange: (status: StatusFilter, time: TimeOfDay | "all" | "now") => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unmet", label: "To Do" },
  { value: "met", label: "Done" },
];

const TIME_OPTIONS: { value: TimeOfDay | "all" | "now"; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "📋" },
  { value: "now", label: "Now", icon: "⏰" },
  { value: "morning", label: "AM", icon: "🌅" },
  { value: "afternoon", label: "PM", icon: "☀️" },
  { value: "evening", label: "Eve", icon: "🌙" },
];

export function HabitFilter({ onFilterChange }: HabitFilterProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [time, setTime] = useState<TimeOfDay | "all" | "now">("all");
  const [showFilters, setShowFilters] = useState(false);

  const handleStatusChange = (newStatus: StatusFilter) => {
    setStatus(newStatus);
    onFilterChange(newStatus, time);
  };

  const handleTimeChange = (newTime: TimeOfDay | "all" | "now") => {
    setTime(newTime);
    onFilterChange(status, newTime);
  };

  const hasActiveFilter = status !== "all" || time !== "all";

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
          hasActiveFilter
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-text-muted hover:border-primary/50"
        )}
      >
        <Filter className="w-4 h-4" />
        <span>Filter</span>
        {hasActiveFilter && (
          <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
            {(status !== "all" ? 1 : 0) + (time !== "all" ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Filter Options */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3 p-3 bg-surface border border-border rounded-xl">
          {/* Status Filter */}
          <div className="flex-1">
            <p className="text-xs text-text-muted mb-2">Status</p>
            <div className="flex gap-1">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={cn(
                    "flex-1 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                    status === option.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Filter */}
          <div className="flex-1">
            <p className="text-xs text-text-muted mb-2">Time</p>
            <div className="flex gap-1">
              {TIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeChange(option.value)}
                  className={cn(
                    "flex-1 px-2 py-1.5 text-sm rounded-lg border transition-colors flex items-center justify-center gap-1",
                    time === option.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="hidden sm:inline">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clear Button */}
          {hasActiveFilter && (
            <button
              onClick={() => {
                setStatus("all");
                setTime("all");
                onFilterChange("all", "all");
              }}
              className="text-xs text-text-muted hover:text-text self-end pb-1"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to determine current time of day
export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}
