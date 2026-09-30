"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { pageStates } from "@/data/copy";

export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <EmptyState title={pageStates.error.title} body={pageStates.error.body} action={<Button onClick={reset}>{pageStates.error.retry}</Button>} />;
}
