import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex-1 flex overflow-hidden">
      <section className="flex-1 p-margin">
        <div className="max-w-3xl mx-auto bg-surface-container-lowest border border-outline-variant p-[80px] space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <div className="border-b border-outline-variant my-6" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>
      <aside className="w-96 bg-surface border-l border-outline-variant p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </aside>
    </main>
  );
}
