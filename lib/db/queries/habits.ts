import { eq, and, desc, asc } from "drizzle-orm";
import { db, habits, habitEntries, type Habit, type NewHabit } from "../index";

export async function getHabitsByUserId(userId: string): Promise<Habit[]> {
  return db
    .select()
    .from(habits)
    .where(and(eq(habits.userId, userId), eq(habits.isArchived, false)))
    .orderBy(asc(habits.sortOrder), desc(habits.createdAt));
}

export async function getHabitById(
  habitId: string,
  userId: string
): Promise<Habit | undefined> {
  const result = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .limit(1);

  return result[0];
}

export async function createHabit(data: NewHabit): Promise<Habit> {
  const result = await db.insert(habits).values(data).returning();
  return result[0];
}

export async function updateHabit(
  habitId: string,
  userId: string,
  data: Partial<NewHabit>
): Promise<Habit | undefined> {
  const result = await db
    .update(habits)
    .set(data)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning();

  return result[0];
}

export async function archiveHabit(
  habitId: string,
  userId: string
): Promise<Habit | undefined> {
  return updateHabit(habitId, userId, { isArchived: true });
}

export async function deleteHabit(
  habitId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
    .returning({ id: habits.id });

  return result.length > 0;
}

// Get habits with today's entry status
export async function getHabitsWithTodayEntry(
  userId: string,
  date: string
): Promise<(Habit & { todayEntry: typeof habitEntries.$inferSelect | null })[]> {
  const userHabits = await getHabitsByUserId(userId);

  const entries = await db
    .select()
    .from(habitEntries)
    .where(
      and(eq(habitEntries.userId, userId), eq(habitEntries.entryDate, date))
    );

  const entriesMap = new Map(entries.map((e) => [e.habitId, e]));

  return userHabits.map((habit) => ({
    ...habit,
    todayEntry: entriesMap.get(habit.id) ?? null,
  }));
}
