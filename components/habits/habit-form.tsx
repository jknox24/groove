"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  HABIT_COLORS,
  TRACKING_TYPES,
  FREQUENCY_OPTIONS,
  DAYS_OF_WEEK,
} from "@/lib/constants";
import type { Habit, CueType } from "@/types";

interface HabitFormProps {
  habit?: Habit;
  availableHabits?: Habit[];
  onSubmit: (formData: FormData) => Promise<{ error?: string }>;
}

const ICONS = ["💪", "📚", "🏃", "💧", "🧘", "✍️", "🎯", "💤", "🥗", "🎨", "🎸", "🧠", "❤️", "🌱", "⭐"];

const CUE_TYPES: { value: CueType; label: string; description: string }[] = [
  { value: "after", label: "After", description: "Do this after completing the cue habit" },
  { value: "before", label: "Before", description: "Do this before the cue habit" },
  { value: "with", label: "With", description: "Do this together with the cue habit" },
];

export function HabitForm({ habit, availableHabits = [], onSubmit }: HabitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(
    !!(habit?.cue_habit_id) || false
  );

  // Smart defaults
  const randomIcon = ICONS[Math.floor(Math.random() * ICONS.length)];
  const randomColor = HABIT_COLORS[Math.floor(Math.random() * HABIT_COLORS.length)].value;

  const [trackingType, setTrackingType] = useState(habit?.tracking_type ?? "boolean");
  const [frequency, setFrequency] = useState(habit?.frequency ?? "daily");
  const [selectedDays, setSelectedDays] = useState<number[]>(
    habit?.frequency_days ?? [1, 2, 3, 4, 5]
  );
  const [selectedColor, setSelectedColor] = useState(habit?.color ?? randomColor);
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon ?? randomIcon);
  const [cueHabitId, setCueHabitId] = useState<string | null>(habit?.cue_habit_id ?? null);
  const [cueType, setCueType] = useState<CueType>(habit?.cue_type ?? "after");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("icon", selectedIcon);
    formData.set("color", selectedColor);
    formData.set("tracking_type", trackingType);
    formData.set("frequency", frequency);
    formData.set("frequency_days", JSON.stringify(selectedDays));
    formData.set("verification_type", "self");
    formData.set("cue_habit_id", cueHabitId ?? "");
    formData.set("cue_type", cueHabitId ? cueType : "");

    const result = await onSubmit(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Name - THE MAIN THING */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">What habit do you want to build?</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Drink water, Read, Exercise"
              defaultValue={habit?.name}
              required
              autoFocus
              className="text-lg py-6"
            />
          </div>

          {/* Quick Icon & Color Picker */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-text-muted">Icon</Label>
              <div className="flex flex-wrap gap-1">
                {ICONS.slice(0, 8).map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-9 h-9 text-lg rounded-md border transition-all ${
                      selectedIcon === icon
                        ? "border-primary bg-primary/10 scale-110"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-text-muted">Color</Label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.slice(0, 6).map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.value
                        ? "border-text scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAdvanced ? "Hide options" : "More options"}
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-6 pt-2 border-t border-border">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Why is this habit important?"
                  defaultValue={habit?.description ?? ""}
                />
              </div>

              {/* Tracking Type */}
              <div className="space-y-2">
                <Label>Tracking style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TRACKING_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setTrackingType(type.value)}
                      className={`p-3 text-left rounded-lg border transition-colors ${
                        trackingType === type.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-text-muted">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Value */}
              {trackingType !== "boolean" && (
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="target_value">Target</Label>
                    <Input
                      id="target_value"
                      name="target_value"
                      type="number"
                      min="1"
                      placeholder={trackingType === "scale" ? "5" : "30"}
                      defaultValue={habit?.target_value?.toString() ?? ""}
                    />
                  </div>
                  {trackingType !== "scale" && (
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="target_unit">Unit</Label>
                      <Input
                        id="target_unit"
                        name="target_unit"
                        placeholder={trackingType === "duration" ? "min" : "times"}
                        defaultValue={habit?.target_unit ?? ""}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Frequency */}
              <div className="space-y-2">
                <Label>Frequency</Label>
                <div className="flex flex-wrap gap-2">
                  {FREQUENCY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFrequency(option.value)}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                        frequency === option.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Days */}
              {frequency === "specific_days" && (
                <div className="space-y-2">
                  <Label>Which days?</Label>
                  <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`w-10 h-10 text-sm font-medium rounded-md border transition-colors ${
                          selectedDays.includes(day.value)
                            ? "border-primary bg-primary text-white"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Habit Stacking */}
              {availableHabits.length > 0 && (
                <div className="space-y-3">
                  <Label>Stack with another habit</Label>
                  <p className="text-xs text-text-muted">
                    Link this habit to another one to build a chain
                  </p>

                  {/* Cue Type Selection */}
                  <div className="flex gap-2">
                    {CUE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setCueType(type.value)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          cueType === type.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {/* Habit Selection */}
                  <select
                    value={cueHabitId ?? ""}
                    onChange={(e) => setCueHabitId(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text focus:border-primary focus:outline-none"
                  >
                    <option value="">No habit (standalone)</option>
                    {availableHabits
                      .filter((h) => h.id !== habit?.id)
                      .map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.icon} {h.name}
                        </option>
                      ))}
                  </select>

                  {cueHabitId && (
                    <p className="text-xs text-primary">
                      {cueType === "after" && "This habit will appear after completing the selected habit"}
                      {cueType === "before" && "This habit will appear before the selected habit"}
                      {cueType === "with" && "This habit will appear together with the selected habit"}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-sm text-error border-l-2 border-error pl-3 py-1">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 py-6 text-base">
          {loading ? "Saving..." : habit ? "Save" : "Create Habit"}
        </Button>
      </div>
    </form>
  );
}
