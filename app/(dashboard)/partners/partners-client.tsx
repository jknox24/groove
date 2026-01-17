"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PartnerCard } from "@/components/partners/partner-card";
import { InviteDialog } from "@/components/partners/invite-dialog";

interface Partner {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface PartnershipData {
  id: string;
  partner: Partner;
  status: "pending" | "active";
  isIncoming: boolean;
  sharedHabitsCount: number;
}

interface PartnersClientProps {
  pendingIncoming: PartnershipData[];
  activePartners: PartnershipData[];
  pendingOutgoing: PartnershipData[];
}

export function PartnersClient({
  pendingIncoming,
  activePartners,
  pendingOutgoing,
}: PartnersClientProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const hasAnyPartners =
    pendingIncoming.length > 0 ||
    activePartners.length > 0 ||
    pendingOutgoing.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Accountability Partners</h1>
        <Button onClick={() => setShowInviteDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Partner
        </Button>
      </div>

      {/* Pending Incoming Requests */}
      {pendingIncoming.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3">
            Partner Requests
          </h2>
          <div className="space-y-3">
            {pendingIncoming.map((p) => (
              <PartnerCard
                key={p.id}
                partnershipId={p.id}
                partner={p.partner}
                status={p.status}
                isIncoming={p.isIncoming}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Partners */}
      {activePartners.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3">
            Your Partners
          </h2>
          <div className="space-y-3">
            {activePartners.map((p) => (
              <PartnerCard
                key={p.id}
                partnershipId={p.id}
                partner={p.partner}
                status={p.status}
                isIncoming={p.isIncoming}
                sharedHabitsCount={p.sharedHabitsCount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Outgoing */}
      {pendingOutgoing.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-text-secondary mb-3">
            Pending Invites
          </h2>
          <div className="space-y-3">
            {pendingOutgoing.map((p) => (
              <PartnerCard
                key={p.id}
                partnershipId={p.id}
                partner={p.partner}
                status={p.status}
                isIncoming={p.isIncoming}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasAnyPartners && (
        <div className="border border-border rounded-lg p-8 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-2">
              No partners yet
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Accountability partners can view your shared habits, verify your
              progress, and send encouraging nudges.
            </p>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Your First Partner
            </Button>
          </div>
        </div>
      )}

      {/* Invite Dialog */}
      <InviteDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />
    </div>
  );
}
