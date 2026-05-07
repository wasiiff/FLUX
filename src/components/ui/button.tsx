import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-label-caps font-label-caps transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary border border-primary hover:bg-on-surface-variant",
        secondary:
          "bg-surface text-primary border border-outline-variant hover:bg-surface-container",
        outline:
          "bg-transparent text-primary border border-outline-variant hover:bg-surface-container-low",
        ghost: "text-primary hover:bg-surface-container-low",
        ai:
          "ai-gradient text-white border border-transparent hover:opacity-95 ai-glow",
        destructive:
          "bg-error text-on-error border border-error hover:opacity-95",
        link:
          "text-primary underline-offset-4 hover:underline border-none px-0 h-auto py-0",
      },
      size: {
        sm: "h-9 px-4",
        default: "h-11 px-6",
        lg: "h-14 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
