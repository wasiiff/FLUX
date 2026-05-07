import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full bg-surface-container-low border-b border-outline-variant px-4 py-2 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant",
        "focus:outline-none focus:border-primary transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full bg-surface-container-low border border-outline-variant px-4 py-3 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant",
      "focus:outline-none focus:border-primary transition-colors resize-y min-h-[120px]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("block font-label-caps text-label-caps text-on-surface mb-2", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";
