"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <EmptyState title="We couldn't load your account" body="Please try again in a moment." action={<Button onClick={reset}>Try again</Button>} />;
}
