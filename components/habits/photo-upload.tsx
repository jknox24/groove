"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  habitId: string;
  entryDate: string;
  currentPhotoUrl?: string | null;
  onPhotoUploaded: (url: string | null) => void;
  disabled?: boolean;
}

export function PhotoUpload({
  habitId,
  entryDate,
  currentPhotoUrl,
  onPhotoUploaded,
  disabled = false,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Create unique file path: userId/habitId/date_timestamp.ext
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${habitId}/${entryDate}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("habit-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("habit-photos")
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onPhotoUploaded(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!previewUrl) return;

    try {
      // Extract file path from URL for deletion
      const supabase = createClient();
      const urlParts = previewUrl.split("/habit-photos/");
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        await supabase.storage.from("habit-photos").remove([filePath]);
      }

      setPreviewUrl(null);
      onPhotoUploaded(null);
    } catch (error) {
      console.error("Remove error:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {previewUrl ? (
        <div className="relative group">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-border">
            <img
              src={previewUrl}
              alt="Habit photo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -top-1 -right-1 flex gap-0.5">
            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="w-4 h-4 rounded-full bg-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            "h-10 w-10 p-0",
            uploading && "cursor-wait"
          )}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  );
}
