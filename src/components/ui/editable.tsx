"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

interface EditableProps {
  /** Element to render. */
  as?: Tag;
  /** Initial value — Editable manages DOM imperatively after mount. */
  value: string;
  /** Called on blur with the trimmed text content. */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** When false (default), Enter blurs and commits. */
  multiline?: boolean;
}

/**
 * A safe contentEditable wrapper.
 * - Sets initial text on mount (and only when external `value` actually diverges).
 * - Reads text on blur and Ctrl+Enter to commit.
 * - Avoids React rerendering DOM during typing (which would reset the caret).
 */
export const Editable = React.forwardRef<HTMLElement, EditableProps>(function Editable(
  { as = "span", value, onChange, placeholder, className, multiline = false },
  forwardedRef,
) {
  const ref = React.useRef<HTMLElement | null>(null);

  // Sync DOM only when external value changes AND it diverges from what's on screen.
  React.useEffect(() => {
    const el = ref.current;
    if (el && el.innerText !== value) {
      el.innerText = value;
    }
  }, [value]);

  function setRef(el: HTMLElement | null) {
    ref.current = el;
    if (typeof forwardedRef === "function") forwardedRef(el);
    else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = el;
  }

  function commit() {
    const next = (ref.current?.innerText ?? "").trim();
    if (next !== value) onChange(next);
  }

  const props: React.HTMLAttributes<HTMLElement> & {
    contentEditable: boolean;
    "data-placeholder"?: string;
  } = {
    contentEditable: true,
    suppressContentEditableWarning: true,
    "data-placeholder": placeholder,
    onBlur: commit,
    onKeyDown: (e) => {
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
      if (multiline && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    },
    className: cn(
      "outline-none focus:ring-1 focus:ring-primary px-1 -mx-1 transition-shadow",
      "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-on-surface-variant/50 [&:empty]:before:pointer-events-none",
      className,
    ),
  };

  // Render the chosen tag with a ref. We deliberately render NO children so React never
  // touches the inner DOM after mount.
  return React.createElement(as, { ref: setRef, ...props });
});
