import { eq, and, between, desc } from "drizzle-orm";
import {
  db,
  habitEntries,
  type HabitEntry,
  type NewHabitEntry,
} from "../index";

export async function getEntriesByHabitId(
  habitId: string,
  userId: string
): Promise<HabitEntry[]> {
  return db
    .select()
    .from(habitEntries)
    .where(
      and(eq(habitEntries.habitId, habitId), eq(habitEntries.userId, userId))
    )
    .orderBy(desc(habitEntries.entryDate));
}

export async function getEntriesByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<HabitEntry[]> {
  return db
    .select()
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.userId, userId),
        between(habitEntries.entryDate, startDate, endDate)
      )
    )
    .orderBy(desc(habitEntries.entryDate));
}

export async function getEntryByDate(
  habitId: string,
  userId: string,
  date: string
): Promise<HabitEntry | undefined> {
  const result = await db
    .select()
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.habitId, habitId),
        eq(habitEntries.userId, userId),
        eq(habitEntries.entryDate, date)
      )
    )
    .limit(1);

  return result[0];
}

export async function createEntry(data: NewHabitEntry): Promise<HabitEntry> {
  const result = await db.insert(habitEntries).values(data).returning();
  return result[0];
}

export async function updateEntry(
  entryId: string,
  userId: string,
  data: Partial<NewHabitEntry>
): Promise<HabitEntry | undefined> {
  const result = await db
    .update(habitEntries)
    .set(data)
    .where(and(eq(habitEntries.id, entryId), eq(habitEntries.userId, userId)))
    .returning();

  return result[0];
}

export async function upsertEntry(
  data: NewHabitEntry
): Promise<HabitEntry> {
  // Try to find existing entry
  const existing = await getEntryByDate(
    data.habitId,
    data.userId,
    data.entryDate
  );

  if (existing) {
    const result = await db
      .update(habitEntries)
      .set(data)
      .where(eq(habitEntries.id, existing.id))
      .returning();
    return result[0];
  }

  return createEntry(data);
}

export async function deleteEntry(
  entryId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(habitEntries)
    .where(and(eq(habitEntries.id, entryId), eq(habitEntries.userId, userId)))
    .returning({ id: habitEntries.id });

  return result.length > 0;
}

// Calculate streak for a habit
export async function calculateStreak(
  habitId: string,
  userId: string
): Promise<{ currentStreak: number; bestStreak: number }> {
  const entries = await db
    .select()
    .from(habitEntries)
    .where(
      and(
        eq(habitEntries.habitId, habitId),
        eq(habitEntries.userId, userId),
        eq(habitEntries.completed, true)
      )
    )
    .orderBy(desc(habitEntries.entryDate));

  if (entries.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < entries.length; i++) {
    const entryDate = new Date(entries[i].entryDate);
    entryDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (entryDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else if (i === 0) {
      // Check if yesterday was completed (streak might still be active)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (entryDate.getTime() === yesterday.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Calculate best streak
  let bestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < entries.length; i++) {
    const current = new Date(entries[i].entryDate);
    const previous = new Date(entries[i - 1].entryDate);

    const diffDays = Math.round(
      (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      tempStreak++;
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  return { currentStreak, bestStreak };
}
