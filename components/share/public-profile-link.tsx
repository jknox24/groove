"use client";

import { useState } from "react";
import { Link2, Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PublicProfileLinkProps {
  username: string | null;
}

export function PublicProfileLink({ username }: PublicProfileLinkProps) {
  const [copied, setCopied] = useState(false);

  if (!username) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
        <Link2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Set a username to get your public profile link
        </p>
        <Link href="/settings">
          <Button variant="outline" size="sm">
            Go to Settings
          </Button>
        </Link>
      </div>
    );
  }

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/progress/${username}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-200 dark:border-violet-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Your Public Profile
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Anyone with this link can see your habit progress
      </p>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-400 font-mono truncate border border-gray-200 dark:border-gray-700">
          {profileUrl}
        </div>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className={copied ? "bg-green-50 border-green-200 text-green-600" : ""}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="mt-3">
        <Link
          href={`/progress/${username}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:underline"
        >
          View your public profile
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
