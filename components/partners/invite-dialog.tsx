"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Link as LinkIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInviteLink } from "@/app/(dashboard)/partners/actions";

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InviteDialog({ open, onClose }: InviteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleGenerateLink() {
    startTransition(async () => {
      const result = await createInviteLink();
      if (result.error) {
        setError(result.error);
      } else if (result.inviteLink) {
        const fullLink = `${window.location.origin}${result.inviteLink}`;
        setInviteLink(fullLink);
      }
    });
  }

  function handleCopy() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setInviteLink(null);
    setCopied(false);
    setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl border border-border shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Invite a Partner</h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-background rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <p className="text-sm text-text-secondary">
              Generate a unique invite link to share with someone you want as an
              accountability partner.
            </p>

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
                {error}
              </div>
            )}

            {!inviteLink ? (
              <Button
                onClick={handleGenerateLink}
                disabled={isPending}
                className="w-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                {isPending ? "Generating..." : "Generate Invite Link"}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg"
                  />
                  <Button onClick={handleCopy} variant="outline">
                    {copied ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-text-muted">
                  Share this link with your partner. When they click it and sign
                  in, you'll be connected.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <Button variant="outline" onClick={handleClose} className="w-full">
              {inviteLink ? "Done" : "Cancel"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
