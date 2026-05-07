import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-on-background">
      <p className="font-label-caps text-label-caps text-on-surface-variant mb-4">404</p>
      <h1 className="font-h1 text-h1 text-on-surface mb-4">Page not found</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md text-center">
        The document you&apos;re looking for has been moved, archived, or never existed.
      </p>
      <Button asChild>
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </main>
  );
}
