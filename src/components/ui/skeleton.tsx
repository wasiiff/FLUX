import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-surface-container-high", className)}
      {...props}
    />
  );
}

export function ShimmerLine({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-4 w-full bg-surface-container-low overflow-hidden", className)}>
      <div className="absolute inset-0 ai-shimmer" />
    </div>
  );
}
