import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-3 py-1 font-label-caps text-label-caps border",
  {
    variants: {
      variant: {
        default: "bg-surface-container-high border-outline-variant text-on-surface",
        outline: "bg-transparent border-outline-variant text-on-surface-variant",
        primary: "bg-primary border-primary text-on-primary",
        ai: "ai-gradient border-transparent text-white",
        success: "bg-surface-container-high border-outline-variant text-on-surface",
        warning: "bg-tertiary-fixed border-outline-variant text-on-tertiary-fixed",
        error: "bg-error-container border-error text-on-error-container",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
