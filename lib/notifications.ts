// Push notification utilities for PWA

const NOTIFICATION_STORAGE_KEY = "groove_notification_settings";

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:MM format
  reminderDays: number[]; // 0-6 (Sun-Sat)
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  reminderTime: "09:00",
  reminderDays: [1, 2, 3, 4, 5], // Weekdays
};

export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
}

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && "serviceWorker" in navigator;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported";

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

export function scheduleLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  // For PWA, we use local notifications through the service worker
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SHOW_NOTIFICATION",
      payload: { title, options },
    });
  } else {
    // Fallback to regular notification
    new Notification(title, options);
  }
}

export function scheduleReminder(): void {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const currentDay = now.getDay();
  const [hours, minutes] = settings.reminderTime.split(":").map(Number);

  // Check if today is a reminder day
  if (!settings.reminderDays.includes(currentDay)) return;

  // Create reminder time for today
  const reminderTime = new Date(now);
  reminderTime.setHours(hours, minutes, 0, 0);

  // Calculate delay
  const delay = reminderTime.getTime() - now.getTime();

  // Only schedule if the reminder is in the future (within next 24 hours)
  if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      scheduleLocalNotification("Time for your habits!", {
        body: "Don't forget to complete your daily habits.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "habit-reminder",
        requireInteraction: false,
      });
    }, delay);
  }
}

// Initialize reminders when app loads
export function initializeNotifications(): void {
  if (typeof window === "undefined") return;

  const settings = getNotificationSettings();
  if (settings.enabled && Notification.permission === "granted") {
    scheduleReminder();
  }
}
