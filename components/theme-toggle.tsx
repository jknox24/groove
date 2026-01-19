"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      <button
        onClick={() => setTheme("light")}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
          theme === "light"
            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        )}
      >
        <Sun className="w-4 h-4" />
        Light
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
          theme === "dark"
            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        )}
      >
        <Moon className="w-4 h-4" />
        Dark
      </button>
      <button
        onClick={() => setTheme("system")}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
          theme === "system"
            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        )}
      >
        <Monitor className="w-4 h-4" />
        Auto
      </button>
    </div>
  );
}
