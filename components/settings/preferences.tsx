"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Preferences() {
  const [soundOn, setSoundOn] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const newValue = !soundOn;
    setSoundOn(newValue);
    setSoundEnabled(newValue);
  };

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Theme
          </label>
          <ThemeToggle />
        </div>

        {/* Sound Effects */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Sound Effects
          </label>
          <button
            onClick={toggleSound}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl border transition-all",
              soundOn
                ? "bg-primary/10 border-primary/20"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                soundOn ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              )}
            >
              {soundOn ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 dark:text-white">
                {soundOn ? "Sound On" : "Sound Off"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {soundOn
                  ? "Play sounds on habit completion"
                  : "Muted - no sounds will play"}
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-7 rounded-full p-1 transition-colors",
                soundOn ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                  soundOn ? "translate-x-5" : "translate-x-0"
                )}
              />
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
