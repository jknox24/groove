"use client";

import { useState, useTransition } from "react";
import { Users, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedDemoPartner } from "@/app/(dashboard)/settings/seed-actions";

export function SeedDemoButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string; partnerName?: string } | null>(null);

  const handleSeed = () => {
    startTransition(async () => {
      const res = await seedDemoPartner();
      setResult(res);
    });
  };

  if (result?.success) {
    return (
      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg">
        <Check className="w-5 h-5" />
        <span>Added {result.partnerName} as a demo partner! Check your Partners page.</span>
      </div>
    );
  }

  if (result?.error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{result.error}</span>
        </div>
        <Button onClick={() => setResult(null)} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleSeed} disabled={isPending} variant="outline">
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Creating demo partner...
        </>
      ) : (
        <>
          <Users className="w-4 h-4 mr-2" />
          Add Demo Partner
        </>
      )}
    </Button>
  );
}
