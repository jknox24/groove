/**
 * Sound effects for habit completion and milestones
 * Uses Web Audio API to generate sounds programmatically
 */

let audioContext: AudioContext | null = null;

/**
 * Get or create audio context
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

/**
 * Check if sounds are enabled (defaults to true)
 */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("soundEnabled") !== "false";
}

/**
 * Toggle sound on/off
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("soundEnabled", enabled ? "true" : "false");
}

/**
 * Play a pleasant completion "ding" sound
 */
function playCompleteTone(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Create a pleasant "ding" with harmonics
  const frequencies = [880, 1108.73, 1318.51]; // A5, C#6, E6 (A major chord)

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    // Quick attack, medium decay
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15 - i * 0.03, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  });
}

/**
 * Play a celebratory milestone sound (ascending arpeggio)
 */
function playMilestoneTone(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // Ascending arpeggio: C5, E5, G5, C6
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    const startTime = now + i * 0.1;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

/**
 * Play completion sound with optional haptic feedback
 */
export function playCompletionSound(): void {
  if (!isSoundEnabled()) return;

  playCompleteTone();

  // Haptic feedback on supported devices
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

/**
 * Play milestone celebration sound
 */
export function playMilestoneSound(): void {
  if (!isSoundEnabled()) return;

  playMilestoneTone();

  // Longer haptic for milestones
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([50, 30, 50]);
  }
}

/**
 * Check if a streak count is a milestone
 */
export function isStreakMilestone(streak: number): boolean {
  return [7, 14, 21, 30, 60, 90, 100, 365].includes(streak);
}

/**
 * Get milestone message for a streak
 */
export function getMilestoneMessage(streak: number): string | null {
  const messages: Record<number, string> = {
    7: "1 week streak! Keep it up!",
    14: "2 weeks strong!",
    21: "3 weeks! Habit forming!",
    30: "30 day streak! Amazing!",
    60: "60 days! Incredible dedication!",
    90: "90 days! You're unstoppable!",
    100: "100 DAY STREAK! Legend!",
    365: "ONE YEAR! Absolute champion!",
  };
  return messages[streak] || null;
}
