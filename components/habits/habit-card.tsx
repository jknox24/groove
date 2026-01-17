import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Habit } from "@/types";

interface HabitCardProps {
  habit: Habit;
}

export function HabitCard({ habit }: HabitCardProps) {
  return (
    <Link
      href={`/habits/${habit.id}`}
      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-background transition-colors"
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: `${habit.color}15` }}
      >
        {habit.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-text truncate">{habit.name}</h3>
        <p className="text-sm text-text-muted">
          {habit.frequency === "daily" && "Every day"}
          {habit.frequency === "weekly" && "Once per week"}
          {habit.frequency === "specific_days" &&
            `${habit.frequency_days?.length} days/week`}
          {habit.tracking_type !== "boolean" && habit.target_value && (
            <span>
              {" "}
              · {habit.target_value}
              {habit.target_unit && ` ${habit.target_unit}`}
            </span>
          )}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-text-muted" />
    </Link>
  );
}
