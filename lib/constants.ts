// Design system colors (matching globals.css)
export const COLORS = {
  primary: "#1B4332",
  primaryLight: "#2D6A4F",
  primaryDark: "#132F23",
  accent: "#E07A5F",
  accentLight: "#E8967F",
  accentDark: "#C65D40",
  background: "#FAFAF8",
  surface: "#FFFFFF",
  border: "#E5E5E3",
  borderSubtle: "#F0F0EE",
  text: "#1A1A19",
  textSecondary: "#6B6B69",
  textMuted: "#9B9B99",
  success: "#2D6A4F",
  warning: "#D4A373",
  error: "#C1444B",
} as const;

// Habit color palette for users to choose from
export const HABIT_COLORS = [
  { name: "Forest", value: "#1B4332" },
  { name: "Coral", value: "#E07A5F" },
  { name: "Sand", value: "#D4A373" },
  { name: "Ocean", value: "#457B9D" },
  { name: "Lavender", value: "#7B6D8D" },
  { name: "Slate", value: "#6B6B69" },
] as const;

// Tracking type options
export const TRACKING_TYPES = [
  { value: "boolean", label: "Yes/No", description: "Simple completion tracking" },
  { value: "quantity", label: "Quantity", description: "Track a number (e.g., 8 glasses of water)" },
  { value: "duration", label: "Duration", description: "Track time spent (e.g., 30 minutes)" },
  { value: "scale", label: "Rating", description: "Rate on a scale (e.g., 1-10)" },
] as const;

// Frequency options
export const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Once per week" },
  { value: "specific_days", label: "Specific days" },
] as const;

// Time of day options
export const TIME_OF_DAY_OPTIONS = [
  { value: "anytime", label: "Anytime", icon: "⏰" },
  { value: "morning", label: "Morning", icon: "🌅" },
  { value: "afternoon", label: "Afternoon", icon: "☀️" },
  { value: "evening", label: "Evening", icon: "🌙" },
] as const;

// Days of the week
export const DAYS_OF_WEEK = [
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
  { value: 0, label: "Sun", fullLabel: "Sunday" },
] as const;

// Verification types
export const VERIFICATION_TYPES = [
  { value: "self", label: "Self-reported", description: "Mark complete on your own", disabled: false },
  { value: "photo", label: "Photo proof", description: "Take a photo as evidence", disabled: false },
  { value: "partner", label: "Partner verification", description: "A partner confirms completion", disabled: false },
  { value: "data_linked", label: "Connected app", description: "Coming soon", disabled: true },
] as const;

// Mood scale
export const MOOD_SCALE = [
  { value: 1, label: "Very Low", emoji: "😔" },
  { value: 2, label: "Low", emoji: "😕" },
  { value: 3, label: "Neutral", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "😊" },
] as const;

// Energy scale
export const ENERGY_SCALE = [
  { value: 1, label: "Exhausted" },
  { value: 2, label: "Tired" },
  { value: 3, label: "Normal" },
  { value: 4, label: "Energized" },
  { value: 5, label: "Very Energized" },
] as const;

// Habit templates for onboarding quick start
export const HABIT_TEMPLATES = [
  { id: "water", name: "Drink Water", icon: "💧", color: "#3b82f6", description: "Stay hydrated throughout the day" },
  { id: "exercise", name: "Exercise", icon: "🏃", color: "#22c55e", description: "30 minutes of movement" },
  { id: "read", name: "Read", icon: "📚", color: "#8b5cf6", description: "Read for 20 minutes" },
  { id: "meditate", name: "Meditate", icon: "🧘", color: "#f59e0b", description: "10 minutes of mindfulness" },
  { id: "sleep", name: "Sleep 8 Hours", icon: "💤", color: "#6366f1", description: "Get quality rest" },
  { id: "journal", name: "Journal", icon: "✍️", color: "#ec4899", description: "Write your thoughts" },
  { id: "stretch", name: "Stretch", icon: "🙆", color: "#14b8a6", description: "Morning stretching routine" },
  { id: "nosugar", name: "No Sugar", icon: "🍬", color: "#ef4444", description: "Avoid added sugars" },
] as const;

// Predefined nudge messages
export const NUDGE_MESSAGES = {
  encouragement: [
    "You've got this! 💪",
    "Keep up the great work!",
    "One day at a time.",
    "Proud of you!",
  ],
  reminder: [
    "Don't forget to log your habit!",
    "Hey, checking in on you.",
    "Your streak is waiting!",
  ],
  celebration: [
    "Amazing streak! 🎉",
    "You're on fire!",
    "Incredible consistency!",
  ],
} as const;
