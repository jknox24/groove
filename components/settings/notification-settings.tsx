"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getNotificationSettings,
  saveNotificationSettings,
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  initializeNotifications,
  type NotificationSettings,
} from "@/lib/notifications";

const DAYS = [
  { value: 0, label: "S", fullLabel: "Sunday" },
  { value: 1, label: "M", fullLabel: "Monday" },
  { value: 2, label: "T", fullLabel: "Tuesday" },
  { value: 3, label: "W", fullLabel: "Wednesday" },
  { value: 4, label: "T", fullLabel: "Thursday" },
  { value: 5, label: "F", fullLabel: "Friday" },
  { value: 6, label: "S", fullLabel: "Saturday" },
];

const TIME_PRESETS = [
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "21:00", label: "9:00 PM" },
];

export function NotificationSettings() {
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    reminderTime: "09:00",
    reminderDays: [1, 2, 3, 4, 5],
  });

  useEffect(() => {
    setMounted(true);
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
    setSettings(getNotificationSettings());
  }, []);

  const handleToggle = async () => {
    if (!settings.enabled) {
      // Turning on - request permission first
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === "granted") {
        const newSettings = { ...settings, enabled: true };
        setSettings(newSettings);
        saveNotificationSettings(newSettings);
        initializeNotifications();
      }
    } else {
      // Turning off
      const newSettings = { ...settings, enabled: false };
      setSettings(newSettings);
      saveNotificationSettings(newSettings);
    }
  };

  const toggleDay = (day: number) => {
    const newDays = settings.reminderDays.includes(day)
      ? settings.reminderDays.filter((d) => d !== day)
      : [...settings.reminderDays, day].sort();

    const newSettings = { ...settings, reminderDays: newDays };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const setTime = (time: string) => {
    const newSettings = { ...settings, reminderTime: time };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  if (!mounted) return null;

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Notifications are not supported on this device or browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <button
          onClick={handleToggle}
          className={cn(
            "flex items-center gap-3 w-full p-3 rounded-xl border transition-all",
            settings.enabled && permission === "granted"
              ? "bg-primary/10 border-primary/20"
              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          )}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              settings.enabled && permission === "granted"
                ? "bg-primary text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500"
            )}
          >
            {settings.enabled && permission === "granted" ? (
              <Bell className="w-5 h-5" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900 dark:text-white">
              {settings.enabled && permission === "granted"
                ? "Reminders On"
                : "Reminders Off"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {permission === "denied"
                ? "Notifications blocked - check browser settings"
                : settings.enabled
                  ? "Daily reminder to check your habits"
                  : "Get notified when it's time for habits"}
            </p>
          </div>
          <div
            className={cn(
              "w-12 h-7 rounded-full p-1 transition-colors",
              settings.enabled && permission === "granted"
                ? "bg-primary"
                : "bg-gray-300 dark:bg-gray-600"
            )}
          >
            <div
              className={cn(
                "w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                settings.enabled && permission === "granted"
                  ? "translate-x-5"
                  : "translate-x-0"
              )}
            />
          </div>
        </button>

        {/* Reminder Settings (only show when enabled) */}
        {settings.enabled && permission === "granted" && (
          <>
            {/* Time Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Reminder Time
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setTime(preset.value)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      settings.reminderTime === preset.value
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Days Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Reminder Days
              </label>
              <div className="flex gap-2 mt-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    title={day.fullLabel}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      settings.reminderDays.includes(day.value)
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
