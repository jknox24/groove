"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Check, X, UserMinus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  acceptPartnership,
  declinePartnership,
  endPartnership,
} from "@/app/(dashboard)/partners/actions";

interface Partner {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface PartnerCardProps {
  partnershipId: string;
  partner: Partner;
  status: "pending" | "active";
  isIncoming: boolean; // true if we received the request
  sharedHabitsCount?: number;
}

export function PartnerCard({
  partnershipId,
  partner,
  status,
  isIncoming,
  sharedHabitsCount = 0,
}: PartnerCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);

  // Handle null partner gracefully
  if (!partner) {
    return null;
  }

  const partnerName = partner.display_name || partner.username || "Partner";
  const initials = partnerName.slice(0, 2).toUpperCase();

  function handleAccept() {
    startTransition(async () => {
      await acceptPartnership(partner.id);
    });
  }

  function handleDecline() {
    startTransition(async () => {
      await declinePartnership(partner.id);
    });
  }

  function handleEndPartnership() {
    if (confirm("Are you sure you want to end this partnership?")) {
      startTransition(async () => {
        await endPartnership(partnershipId);
      });
    }
    setShowMenu(false);
  }

  return (
    <Card className={isPending ? "opacity-50" : ""}>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {partner.avatar_url ? (
            <img
              src={partner.avatar_url}
              alt={partnerName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              {initials}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/partners/${partner.id}`}
              className="font-medium text-text hover:text-primary transition-colors"
            >
              {partnerName}
            </Link>
            {status === "active" ? (
              <p className="text-sm text-text-muted">
                {sharedHabitsCount > 0
                  ? `${sharedHabitsCount} shared habit${sharedHabitsCount !== 1 ? "s" : ""}`
                  : "No shared habits yet"}
              </p>
            ) : (
              <p className="text-sm text-warning">
                {isIncoming ? "Wants to partner with you" : "Pending acceptance"}
              </p>
            )}
          </div>

          {/* Actions */}
          {status === "pending" && isIncoming ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
                disabled={isPending}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleAccept} disabled={isPending}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : status === "active" ? (
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                    <Link
                      href={`/partners/${partner.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-background transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <Eye className="w-4 h-4" />
                      View Partner
                    </Link>
                    <button
                      onClick={handleEndPartnership}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-background transition-colors w-full text-left"
                    >
                      <UserMinus className="w-4 h-4" />
                      End Partnership
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <span className="text-sm text-text-muted">Pending...</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
