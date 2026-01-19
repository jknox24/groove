"use client";

import { useState } from "react";
import { X, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EmailVerificationBannerProps {
  email: string;
  emailConfirmedAt: string | null;
}

export function EmailVerificationBanner({ email, emailConfirmedAt }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Don't show if email is confirmed or dismissed
  if (emailConfirmedAt || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setSending(false);
    if (!error) {
      setSent(true);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {sent ? (
              "Verification email sent! Check your inbox."
            ) : (
              <>
                Please verify your email address.{" "}
                <button
                  onClick={handleResend}
                  disabled={sending}
                  className="underline hover:no-underline font-medium"
                >
                  {sending ? "Sending..." : "Resend email"}
                </button>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800 rounded"
        >
          <X className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>
      </div>
    </div>
  );
}
