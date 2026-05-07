"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "My Resumes", icon: "description" },
  { href: "/optimize", label: "Job Analysis", icon: "analytics" },
  { href: "/portfolio", label: "Portfolio", icon: "collections_bookmark" },
  { href: "/account", label: "Account Settings", icon: "settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex bg-surface-container-lowest text-primary docked left-0 h-full w-64 border-r border-outline-variant flex-col py-margin px-unit shrink-0 z-40">
      <div className="px-6 mb-margin">
        <h2 className="font-h3 text-h3 text-primary mb-1">Strategy Suite</h2>
        <p className="text-on-surface-variant text-label-caps font-label-caps">
          Executive Resume Optimization
        </p>
      </div>

      <div className="px-4 mb-8">
        <Button asChild className="w-full justify-center" size="default">
          <Link href="/dashboard?new=1">
            <MaterialSymbol name="add" opticalSize={20} />
            New Document
          </Link>
        </Button>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 font-body-md text-body-md transition-all",
                active
                  ? "bg-surface-container-high text-primary font-medium border-l-4 border-primary"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low border-l-4 border-transparent",
              )}
            >
              <MaterialSymbol name={item.icon} fill={active} opticalSize={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
