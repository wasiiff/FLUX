"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/ui/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Review" },
  { href: "/optimize", label: "Optimize" },
  { href: "/portfolio", label: "Broadcast" },
  { href: "/archive", label: "Archive" },
];

export function Topbar({ user }: { user?: { name?: string | null; email: string; image?: string | null } }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = (mounted && (theme === "dark" || resolvedTheme === "dark")) ?? false;

  return (
    <header className="bg-surface-bright text-primary border-b border-outline-variant flex justify-between items-center px-margin h-16 w-full z-50 sticky top-0">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="font-h3 text-h3 font-medium text-primary tracking-tight">
          FLUX
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {PRIMARY_NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "text-primary border-b-2 border-primary pb-1 font-body-md"
                    : "text-on-surface-variant hover:text-primary transition-colors font-body-md"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="text-on-surface-variant hover:text-primary p-2 transition-colors"
          aria-label="Toggle theme"
        >
          <MaterialSymbol name={isDark ? "light_mode" : "dark_mode"} opticalSize={20} />
        </button>
        <button
          onClick={async () => {
            await signOut();
            router.replace("/sign-in");
          }}
          className="flex items-center gap-2"
          aria-label="Sign out"
        >
          <Avatar className="h-8 w-8">
            {user?.image ? <AvatarImage src={user.image} alt={user.name ?? user.email} /> : null}
            <AvatarFallback>
              {(user?.name ?? user?.email ?? "F").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </header>
  );
}
