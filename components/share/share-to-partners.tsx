"use client";

import { useState, useTransition } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendProgressUpdate } from "@/app/(dashboard)/partners/share/actions";
import { cn } from "@/lib/utils";

interface Partner {
  partnershipId: string;
  partnerId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ShareToPartnersProps {
  partners: Partner[];
  completionRate: number;
}

export function ShareToPartners({ partners, completionRate }: ShareToPartnersProps) {
  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set());
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const togglePartner = (partnerId: string) => {
    const newSelected = new Set(selectedPartners);
    if (newSelected.has(partnerId)) {
      newSelected.delete(partnerId);
    } else {
      newSelected.add(partnerId);
    }
    setSelectedPartners(newSelected);
  };

  const handleSend = () => {
    if (selectedPartners.size === 0) return;

    startTransition(async () => {
      const partnerIds = Array.from(selectedPartners);
      await sendProgressUpdate(partnerIds, completionRate);
      setSentTo(new Set([...sentTo, ...partnerIds]));
      setSelectedPartners(new Set());
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Partner Selection */}
      <div className="space-y-2">
        {partners.map((partner) => {
          const isSelected = selectedPartners.has(partner.partnerId);
          const wasSent = sentTo.has(partner.partnerId);

          return (
            <button
              key={partner.partnerId}
              onClick={() => !wasSent && togglePartner(partner.partnerId)}
              disabled={wasSent}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                wasSent
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                  : isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
              )}
            >
              {/* Avatar */}
              {partner.avatarUrl ? (
                <img
                  src={partner.avatarUrl}
                  alt={partner.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {getInitials(partner.displayName)}
                </div>
              )}

              {/* Name */}
              <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                {partner.displayName}
              </span>

              {/* Status */}
              {wasSent ? (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <Check className="w-4 h-4" />
                  Sent
                </span>
              ) : (
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-gray-300 dark:border-gray-600"
                  )}
                >
                  {isSelected && <Check className="w-full h-full text-white p-0.5" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSend}
        disabled={selectedPartners.size === 0 || isPending}
        className="w-full"
      >
        <Send className="w-4 h-4 mr-2" />
        {isPending
          ? "Sending..."
          : selectedPartners.size > 0
          ? `Send to ${selectedPartners.size} partner${selectedPartners.size > 1 ? "s" : ""}`
          : "Select partners to send"}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Partners will receive a nudge with your weekly progress
      </p>
    </div>
  );
}
