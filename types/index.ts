// Database types
export type TrackingType = "boolean" | "quantity" | "duration" | "scale";
export type Frequency = "daily" | "weekly" | "specific_days";
export type VerificationType = "self" | "photo" | "partner" | "data_linked";
export type CueType = "after" | "before" | "with";
export type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";
export type PartnershipStatus = "pending" | "active" | "declined" | "ended";
export type NudgeType = "encouragement" | "reminder" | "celebration";
export type InsightType = "weekly_summary" | "pattern" | "suggestion" | "streak_risk";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  tracking_type: TrackingType;
  target_value: number | null;
  target_unit: string | null;
  frequency: Frequency;
  frequency_days: number[] | null;
  verification_type: VerificationType;
  time_of_day: TimeOfDay | null;
  cue_habit_id: string | null;
  cue_type: CueType | null;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  user_id: string;
  entry_date: string;
  completed: boolean;
  value: number | null;
  photo_url: string | null;
  partner_verified: boolean | null;
  partner_verified_at: string | null;
  partner_verified_by: string | null;
  note: string | null;
  mood: number | null;
  energy: number | null;
  created_at: string;
  updated_at: string;
}

export interface Partnership {
  id: string;
  requester_id: string;
  partner_id: string;
  status: PartnershipStatus;
  can_view_habits: boolean;
  can_verify_entries: boolean;
  can_send_nudges: boolean;
  created_at: string;
  accepted_at: string | null;
  ended_at: string | null;
}

export interface HabitShare {
  id: string;
  habit_id: string;
  partnership_id: string;
  can_view: boolean;
  can_verify: boolean;
  created_at: string;
}

export interface Nudge {
  id: string;
  from_user_id: string;
  to_user_id: string;
  habit_id: string | null;
  message: string | null;
  type: NudgeType;
  read_at: string | null;
  created_at: string;
}

export interface Insight {
  id: string;
  user_id: string;
  insight_type: InsightType;
  content: Record<string, unknown>;
  generated_at: string;
  dismissed_at: string | null;
  acted_on: boolean;
}

// UI Types
export interface HabitWithEntry extends Habit {
  todayEntry?: HabitEntry;
  currentStreak: number;
  bestStreak: number;
}
