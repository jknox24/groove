"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendNudge } from "../actions";

interface NudgeButtonProps {
  partnerId: string;
  partnershipId: string;
  partnerName: string;
}

const NUDGE_MESSAGES = [
  "Hey! Just checking in on your habits today",
  "You've got this! Time to check in?",
  "Friendly reminder to stay on track!",
  "Don't forget your habits today!",
];

export function NudgeButton({ partnerId, partnershipId, partnerName }: NudgeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleNudge() {
    const randomMessage = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];

    startTransition(async () => {
      await sendNudge(partnerId, partnershipId, undefined, randomMessage);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleNudge}
      disabled={isPending || sent}
      className="gap-2"
    >
      <Bell className="w-4 h-4" />
      {sent ? "Nudge sent!" : isPending ? "Sending..." : `Nudge ${partnerName.split(" ")[0]}`}
    </Button>
  );
}
