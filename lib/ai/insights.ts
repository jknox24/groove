import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface HabitData {
  name: string;
  frequency: string;
  trackingType: string;
  currentStreak: number;
  bestStreak: number;
  completionRate7Days: number;
  completionRate30Days: number;
  totalCompleted: number;
  recentEntries: Array<{
    date: string;
    completed: boolean;
    value?: number | null;
  }>;
}

export async function generateInsights(habits: HabitData[]): Promise<string> {
  if (habits.length === 0) {
    return "Start tracking some habits to get personalized insights!";
  }

  const habitSummary = habits.map(h => `
- **${h.name}** (${h.frequency}, ${h.trackingType})
  - Current streak: ${h.currentStreak} days
  - Best streak: ${h.bestStreak} days
  - Last 7 days: ${h.completionRate7Days}% completion
  - Last 30 days: ${h.completionRate30Days}% completion
  - Total completions: ${h.totalCompleted}
  - Recent pattern: ${h.recentEntries.slice(0, 7).map(e => e.completed ? "✓" : "✗").join(" ")}
`).join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `You are a supportive habit coach. Based on this user's habit data, provide 2-3 brief, actionable insights. Be encouraging but honest. Focus on patterns, wins, and one specific suggestion for improvement. Keep it concise and conversational.

User's Habits:
${habitSummary}

Provide insights in a friendly, motivating tone. Use simple formatting with bullet points. Don't be generic - reference their specific habits and data.`,
      },
    ],
  });

  const textBlock = message.content.find(block => block.type === "text");
  return textBlock?.text || "Unable to generate insights at this time.";
}
