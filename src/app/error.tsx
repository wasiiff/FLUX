"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-on-background">
      <p className="font-label-caps text-label-caps text-error mb-4">Something went wrong</p>
      <h1 className="font-h1 text-h1 text-on-surface mb-4">Unexpected error</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md text-center">
        Our optimization engine hit an unexpected state. The team has been notified.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
