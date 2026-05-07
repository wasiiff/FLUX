import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex-1 p-margin max-w-[var(--spacing-container-max)] mx-auto w-full">
      <Skeleton className="h-12 w-1/2 mb-3" />
      <Skeleton className="h-5 w-1/3 mb-12" />
      <div className="grid grid-cols-3 gap-gutter mb-12">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
      <Skeleton className="h-72" />
    </main>
  );
}
