"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  HABIT_COLORS,
  TRACKING_TYPES,
  FREQUENCY_OPTIONS,
  DAYS_OF_WEEK,
  VERIFICATION_TYPES,
} from "@/lib/constants";
import type { Habit } from "@/types";

interface HabitFormProps {
  habit?: Habit;
  onSubmit: (formData: FormData) => Promise<{ error?: string }>;
}

const ICONS = ["💪", "📚", "🏃", "💧", "🧘", "✍️", "🎯", "💤", "🥗", "🎨"];

export function HabitForm({ habit, onSubmit }: HabitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingType, setTrackingType] = useState(habit?.tracking_type ?? "boolean");
  const [frequency, setFrequency] = useState(habit?.frequency ?? "daily");
  const [selectedDays, setSelectedDays] = useState<number[]>(
    habit?.frequency_days ?? [1, 2, 3, 4, 5]
  );
  const [selectedColor, setSelectedColor] = useState(
    habit?.color ?? HABIT_COLORS[0].value
  );
  const [selectedIcon, setSelectedIcon] = useState(habit?.icon ?? "💪");
  const [verificationType, setVerificationType] = useState(habit?.verification_type ?? "self");

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
    formData.set("verification_type", verificationType);

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
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Drink 8 glasses of water"
              defaultValue={habit?.name}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Why is this habit important to you?"
              defaultValue={habit?.description ?? ""}
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 text-xl rounded-md border transition-colors ${
                    selectedIcon === icon
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color.value
                      ? "border-text scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Tracking Type */}
          <div className="space-y-2">
            <Label>How do you want to track this?</Label>
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

          {/* Target Value (for quantity/duration/scale) */}
          {trackingType !== "boolean" && (
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="target_value">Target</Label>
                <Input
                  id="target_value"
                  name="target_value"
                  type="number"
                  min="1"
                  placeholder={trackingType === "scale" ? "10" : "30"}
                  defaultValue={habit?.target_value?.toString() ?? ""}
                />
              </div>
              {trackingType !== "scale" && (
                <div className="flex-1 space-y-2">
                  <Label htmlFor="target_unit">Unit</Label>
                  <Input
                    id="target_unit"
                    name="target_unit"
                    placeholder={trackingType === "duration" ? "minutes" : "glasses"}
                    defaultValue={habit?.target_unit ?? ""}
                  />
                </div>
              )}
            </div>
          )}

          {/* Frequency */}
          <div className="space-y-2">
            <Label>How often?</Label>
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

          {/* Verification Type */}
          <div className="space-y-2">
            <Label>How do you want to verify completion?</Label>
            <div className="grid grid-cols-2 gap-2">
              {VERIFICATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => !type.disabled && setVerificationType(type.value)}
                  disabled={type.disabled}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    type.disabled
                      ? "opacity-50 cursor-not-allowed border-border"
                      : verificationType === type.value
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
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : habit ? "Update Habit" : "Create Habit"}
        </Button>
      </div>
    </form>
  );
}
