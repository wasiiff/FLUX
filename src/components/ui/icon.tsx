import * as React from "react";
import { cn } from "@/lib/utils";

export interface MaterialSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  fill?: boolean;
  /** 100 – 700, default 400 */
  weight?: number;
  /** -25 to 200, default 0 */
  grade?: number;
  /** Optical size in px — Material Symbols supports 20–48. Default 24. */
  opticalSize?: number;
}

export function MaterialSymbol({
  name,
  fill,
  weight = 400,
  grade = 0,
  opticalSize = 24,
  className,
  style,
  ...props
}: MaterialSymbolProps) {
  return (
    <span
      aria-hidden
      className={cn("symbol leading-none select-none shrink-0", className)}
      style={{
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${opticalSize}`,
        fontSize: opticalSize,
        ...style,
      }}
      {...props}
    >
      {name}
    </span>
  );
}
