import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  date,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// PROFILES
// ============================================
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").default("America/Los_Angeles"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  habits: many(habits),
  entries: many(habitEntries),
  requestedPartnerships: many(partnerships, { relationName: "requester" }),
  receivedPartnerships: many(partnerships, { relationName: "partner" }),
  sentNudges: many(nudges, { relationName: "sender" }),
  receivedNudges: many(nudges, { relationName: "receiver" }),
  insights: many(insights),
}));

// ============================================
// HABITS
// ============================================
export const habits = pgTable(
  "habits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),

    // Tracking configuration
    trackingType: text("tracking_type").notNull().default("boolean"),
    targetValue: numeric("target_value"),
    targetUnit: text("target_unit"),

    // Frequency
    frequency: text("frequency").notNull().default("daily"),
    frequencyDays: integer("frequency_days").array(),

    // Verification settings
    verificationType: text("verification_type").notNull().default("self"),

    // Habit stacking
    cueHabitId: uuid("cue_habit_id"),
    cueType: text("cue_type"),

    // Metadata
    isArchived: boolean("is_archived").default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_habits_user_id").on(table.userId)]
);

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(profiles, {
    fields: [habits.userId],
    references: [profiles.id],
  }),
  cueHabit: one(habits, {
    fields: [habits.cueHabitId],
    references: [habits.id],
    relationName: "habitStack",
  }),
  stackedHabits: many(habits, { relationName: "habitStack" }),
  entries: many(habitEntries),
  shares: many(habitShares),
  nudges: many(nudges),
}));

// ============================================
// HABIT ENTRIES
// ============================================
export const habitEntries = pgTable(
  "habit_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .references(() => habits.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),

    entryDate: date("entry_date").notNull(),

    // Flexible value storage
    completed: boolean("completed").default(false),
    value: numeric("value"),

    // Verification
    photoUrl: text("photo_url"),
    partnerVerified: boolean("partner_verified"),
    partnerVerifiedAt: timestamp("partner_verified_at", { withTimezone: true }),
    partnerVerifiedBy: uuid("partner_verified_by").references(
      () => profiles.id
    ),

    // Context (for AI insights)
    note: text("note"),
    mood: integer("mood"),
    energy: integer("energy"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("habit_entries_habit_date").on(table.habitId, table.entryDate),
    index("idx_habit_entries_habit_id").on(table.habitId),
    index("idx_habit_entries_user_date").on(table.userId, table.entryDate),
  ]
);

export const habitEntriesRelations = relations(habitEntries, ({ one }) => ({
  habit: one(habits, {
    fields: [habitEntries.habitId],
    references: [habits.id],
  }),
  user: one(profiles, {
    fields: [habitEntries.userId],
    references: [profiles.id],
  }),
  verifier: one(profiles, {
    fields: [habitEntries.partnerVerifiedBy],
    references: [profiles.id],
  }),
}));

// ============================================
// PARTNERSHIPS
// ============================================
export const partnerships = pgTable(
  "partnerships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requesterId: uuid("requester_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    partnerId: uuid("partner_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),

    status: text("status").notNull().default("pending"),

    // Permissions
    canViewHabits: boolean("can_view_habits").default(true),
    canVerifyEntries: boolean("can_verify_entries").default(true),
    canSendNudges: boolean("can_send_nudges").default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (table) => [
    unique("partnerships_requester_partner").on(
      table.requesterId,
      table.partnerId
    ),
    index("idx_partnerships_users").on(table.requesterId, table.partnerId),
  ]
);

export const partnershipsRelations = relations(partnerships, ({ one, many }) => ({
  requester: one(profiles, {
    fields: [partnerships.requesterId],
    references: [profiles.id],
    relationName: "requester",
  }),
  partner: one(profiles, {
    fields: [partnerships.partnerId],
    references: [profiles.id],
    relationName: "partner",
  }),
  habitShares: many(habitShares),
}));

// ============================================
// HABIT SHARES
// ============================================
export const habitShares = pgTable(
  "habit_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    habitId: uuid("habit_id")
      .references(() => habits.id, { onDelete: "cascade" })
      .notNull(),
    partnershipId: uuid("partnership_id")
      .references(() => partnerships.id, { onDelete: "cascade" })
      .notNull(),

    canView: boolean("can_view").default(true),
    canVerify: boolean("can_verify").default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("habit_shares_habit_partnership").on(
      table.habitId,
      table.partnershipId
    ),
  ]
);

export const habitSharesRelations = relations(habitShares, ({ one }) => ({
  habit: one(habits, {
    fields: [habitShares.habitId],
    references: [habits.id],
  }),
  partnership: one(partnerships, {
    fields: [habitShares.partnershipId],
    references: [partnerships.id],
  }),
}));

// ============================================
// NUDGES
// ============================================
export const nudges = pgTable(
  "nudges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromUserId: uuid("from_user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    toUserId: uuid("to_user_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    habitId: uuid("habit_id").references(() => habits.id, {
      onDelete: "set null",
    }),

    message: text("message"),
    type: text("type").default("encouragement"),

    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("idx_nudges_to_user").on(table.toUserId, table.readAt)]
);

export const nudgesRelations = relations(nudges, ({ one }) => ({
  sender: one(profiles, {
    fields: [nudges.fromUserId],
    references: [profiles.id],
    relationName: "sender",
  }),
  receiver: one(profiles, {
    fields: [nudges.toUserId],
    references: [profiles.id],
    relationName: "receiver",
  }),
  habit: one(habits, {
    fields: [nudges.habitId],
    references: [habits.id],
  }),
}));

// ============================================
// INSIGHTS
// ============================================
export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),

  insightType: text("insight_type").notNull(),
  content: jsonb("content").notNull(),

  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  actedOn: boolean("acted_on").default(false),
});

export const insightsRelations = relations(insights, ({ one }) => ({
  user: one(profiles, {
    fields: [insights.userId],
    references: [profiles.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;

export type HabitEntry = typeof habitEntries.$inferSelect;
export type NewHabitEntry = typeof habitEntries.$inferInsert;

export type Partnership = typeof partnerships.$inferSelect;
export type NewPartnership = typeof partnerships.$inferInsert;

export type HabitShare = typeof habitShares.$inferSelect;
export type NewHabitShare = typeof habitShares.$inferInsert;

export type Nudge = typeof nudges.$inferSelect;
export type NewNudge = typeof nudges.$inferInsert;

export type Insight = typeof insights.$inferSelect;
export type NewInsight = typeof insights.$inferInsert;
