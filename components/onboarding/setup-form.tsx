"use client";

import { useState, useTransition } from "react";
import { Check, Plus, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HABIT_TEMPLATES, HABIT_COLORS } from "@/lib/constants";
import { createHabitsFromTemplates, createCustomHabit } from "@/app/(dashboard)/setup/actions";

const ICONS = ["💪", "📚", "🏃", "💧", "🧘", "✍️", "🎯", "💤", "🥗", "🎨", "🎸", "🧠"];

export function SetupForm() {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("✨");
  const [customColor, setCustomColor] = useState("#7c3aed");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleGetStarted = () => {
    setError(null);
    startTransition(async () => {
      const result = await createHabitsFromTemplates(selectedTemplates);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) {
      setError("Please enter a habit name");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("name", customName);
    formData.set("icon", customIcon);
    formData.set("color", customColor);

    startTransition(async () => {
      const result = await createCustomHabit(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to Groove!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Pick some habits to get started, or create your own
          </p>
        </div>

        {/* Template Grid */}
        {!showCustom && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {HABIT_TEMPLATES.map((template) => {
                const isSelected = selectedTemplates.includes(template.id);
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => toggleTemplate(template.id)}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-2"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      {template.icon}
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {template.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {template.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Create Custom Option */}
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-primary mb-6"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create Custom Habit</span>
            </button>
          </>
        )}

        {/* Custom Habit Form */}
        {showCustom && (
          <div className="space-y-4 mb-6">
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ← Back to templates
            </button>

            <div>
              <Input
                placeholder="What habit do you want to build?"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="text-lg py-6"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pick an icon</p>
              <div className="flex flex-wrap gap-1">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setCustomIcon(icon)}
                    className={cn(
                      "w-9 h-9 text-lg rounded-md border transition-all",
                      customIcon === icon
                        ? "border-primary bg-primary/10 scale-110"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pick a color</p>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setCustomColor(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      customColor === color.value
                        ? "border-gray-900 dark:border-white scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateCustom}
              disabled={isPending || !customName.trim()}
              className="w-full py-6"
            >
              {isPending ? "Creating..." : "Create & Get Started"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-sm text-red-500 text-center mb-4">{error}</div>
        )}

        {/* Get Started Button (for templates) */}
        {!showCustom && (
          <Button
            onClick={handleGetStarted}
            disabled={isPending}
            className="w-full py-6 text-base"
          >
            {isPending
              ? "Setting up..."
              : selectedTemplates.length > 0
                ? `Get Started with ${selectedTemplates.length} habit${selectedTemplates.length > 1 ? "s" : ""}`
                : "Skip for now"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {/* Skip hint */}
        {!showCustom && selectedTemplates.length === 0 && (
          <p className="text-center text-xs text-gray-400 mt-3">
            You can always add habits later
          </p>
        )}
      </div>
    </div>
  );
}
