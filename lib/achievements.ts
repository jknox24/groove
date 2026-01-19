/**
 * Achievement badges system
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "streak" | "completion" | "consistency" | "special";
  requirement: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "🔥",
    category: "streak",
    requirement: 7,
    tier: "bronze",
  },
  {
    id: "streak_14",
    name: "Fortnight Fighter",
    description: "Maintain a 14-day streak",
    icon: "🔥",
    category: "streak",
    requirement: 14,
    tier: "bronze",
  },
  {
    id: "streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "⚡",
    category: "streak",
    requirement: 30,
    tier: "silver",
  },
  {
    id: "streak_60",
    name: "Two Month Titan",
    description: "Maintain a 60-day streak",
    icon: "⚡",
    category: "streak",
    requirement: 60,
    tier: "silver",
  },
  {
    id: "streak_90",
    name: "Quarter Champion",
    description: "Maintain a 90-day streak",
    icon: "👑",
    category: "streak",
    requirement: 90,
    tier: "gold",
  },
  {
    id: "streak_180",
    name: "Half Year Hero",
    description: "Maintain a 180-day streak",
    icon: "👑",
    category: "streak",
    requirement: 180,
    tier: "gold",
  },
  {
    id: "streak_365",
    name: "Year Legend",
    description: "Maintain a 365-day streak",
    icon: "💎",
    category: "streak",
    requirement: 365,
    tier: "platinum",
  },

  // Completion achievements
  {
    id: "complete_10",
    name: "Getting Started",
    description: "Complete 10 habit check-ins",
    icon: "✓",
    category: "completion",
    requirement: 10,
    tier: "bronze",
  },
  {
    id: "complete_50",
    name: "Building Momentum",
    description: "Complete 50 habit check-ins",
    icon: "✓",
    category: "completion",
    requirement: 50,
    tier: "bronze",
  },
  {
    id: "complete_100",
    name: "Century Club",
    description: "Complete 100 habit check-ins",
    icon: "💯",
    category: "completion",
    requirement: 100,
    tier: "silver",
  },
  {
    id: "complete_500",
    name: "Habit Machine",
    description: "Complete 500 habit check-ins",
    icon: "🚀",
    category: "completion",
    requirement: 500,
    tier: "gold",
  },
  {
    id: "complete_1000",
    name: "Thousand Strong",
    description: "Complete 1,000 habit check-ins",
    icon: "⭐",
    category: "completion",
    requirement: 1000,
    tier: "platinum",
  },

  // Consistency achievements
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Complete all habits for 7 days straight",
    icon: "🎯",
    category: "consistency",
    requirement: 7,
    tier: "silver",
  },
  {
    id: "perfect_month",
    name: "Perfect Month",
    description: "Complete all habits for 30 days straight",
    icon: "🏆",
    category: "consistency",
    requirement: 30,
    tier: "gold",
  },

  // Special achievements
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete a habit before 7am",
    icon: "🌅",
    category: "special",
    requirement: 1,
    tier: "bronze",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete a habit after 10pm",
    icon: "🦉",
    category: "special",
    requirement: 1,
    tier: "bronze",
  },
  {
    id: "habit_creator",
    name: "Habit Architect",
    description: "Create 5 different habits",
    icon: "🏗️",
    category: "special",
    requirement: 5,
    tier: "bronze",
  },
  {
    id: "habit_master",
    name: "Habit Master",
    description: "Create 10 different habits",
    icon: "🎨",
    category: "special",
    requirement: 10,
    tier: "silver",
  },
];

export interface UserStats {
  totalCompletions: number;
  bestStreak: number;
  currentStreak: number;
  perfectDays: number;
  habitsCreated: number;
  hasEarlyCompletion: boolean;
  hasLateCompletion: boolean;
}

export interface EarnedAchievement extends Achievement {
  earnedAt?: string;
  progress: number; // 0-100
}

/**
 * Calculate which achievements a user has earned
 */
export function calculateAchievements(stats: UserStats): EarnedAchievement[] {
  return ACHIEVEMENTS.map((achievement) => {
    let progress = 0;
    let earned = false;

    switch (achievement.category) {
      case "streak":
        progress = Math.min(100, (stats.bestStreak / achievement.requirement) * 100);
        earned = stats.bestStreak >= achievement.requirement;
        break;

      case "completion":
        progress = Math.min(100, (stats.totalCompletions / achievement.requirement) * 100);
        earned = stats.totalCompletions >= achievement.requirement;
        break;

      case "consistency":
        progress = Math.min(100, (stats.perfectDays / achievement.requirement) * 100);
        earned = stats.perfectDays >= achievement.requirement;
        break;

      case "special":
        if (achievement.id === "early_bird") {
          progress = stats.hasEarlyCompletion ? 100 : 0;
          earned = stats.hasEarlyCompletion;
        } else if (achievement.id === "night_owl") {
          progress = stats.hasLateCompletion ? 100 : 0;
          earned = stats.hasLateCompletion;
        } else if (achievement.id === "habit_creator") {
          progress = Math.min(100, (stats.habitsCreated / 5) * 100);
          earned = stats.habitsCreated >= 5;
        } else if (achievement.id === "habit_master") {
          progress = Math.min(100, (stats.habitsCreated / 10) * 100);
          earned = stats.habitsCreated >= 10;
        }
        break;
    }

    return {
      ...achievement,
      progress: Math.round(progress),
      earnedAt: earned ? new Date().toISOString() : undefined,
    };
  });
}

/**
 * Get tier color
 */
export function getTierColor(tier: Achievement["tier"]): string {
  switch (tier) {
    case "bronze":
      return "#CD7F32";
    case "silver":
      return "#C0C0C0";
    case "gold":
      return "#FFD700";
    case "platinum":
      return "#E5E4E2";
    default:
      return "#666";
  }
}

/**
 * Get tier background
 */
export function getTierBackground(tier: Achievement["tier"]): string {
  switch (tier) {
    case "bronze":
      return "linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)";
    case "silver":
      return "linear-gradient(135deg, #C0C0C0 0%, #808080 100%)";
    case "gold":
      return "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)";
    case "platinum":
      return "linear-gradient(135deg, #E5E4E2 0%, #BCC6CC 100%)";
    default:
      return "#666";
  }
}
