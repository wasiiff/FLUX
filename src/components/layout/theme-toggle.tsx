"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", icon: "light_mode", label: "Light" },
  { value: "dark", icon: "dark_mode", label: "Dark" },
  { value: "system", icon: "computer", label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="inline-flex border border-outline-variant" role="radiogroup">
      {OPTIONS.map((o) => {
        const active = mounted && (theme === o.value || (!theme && o.value === "system"));
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={cn(
              "px-4 h-10 inline-flex items-center gap-2 font-label-caps text-label-caps transition-colors",
              active
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container-low",
            )}
          >
            <MaterialSymbol name={o.icon} opticalSize={20} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
