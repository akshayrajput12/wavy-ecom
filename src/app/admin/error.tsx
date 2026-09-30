"use client";

import { Lock, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

// ponytail: production strips server error details, so 401/403 is detected from status/code/message when present.
const denied = (e: Error & { status?: number; code?: string }) =>
  e.status === 401 || e.status === 403 || /unauthenticated|forbidden/i.test(`${e.code ?? ""} ${e.message}`);

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  if (denied(error)) {
    return (
      <EmptyState
        icon={<Lock className="size-8" />}
        title="No access"
        body="Your account can't open this page. Ask a super admin if you need it."
        action={<Link href="/admin/dashboard" className="text-body underline underline-offset-4">Back to dashboard</Link>}
      />
    );
  }
  return (
    <EmptyState
      icon={<TriangleAlert className="size-8" />}
      title="Something went wrong"
      body={error.digest ? `This page failed to load (ref ${error.digest}).` : "This page failed to load."}
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
