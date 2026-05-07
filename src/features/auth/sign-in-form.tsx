"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MaterialSymbol } from "@/components/ui/icon";
import { signIn } from "@/lib/auth/client";

export function SignInForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("from") ?? "/dashboard";
  const [pending, setPending] = useState(false);

  async function handleEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    setPending(true);
    const res = await signIn.email({ email, password, callbackURL: redirectTo });
    setPending(false);
    if (res.error) {
      toast.error(res.error.message ?? "Sign-in failed");
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  }

  async function handleGoogle() {
    setPending(true);
    await signIn.social({ provider: "google", callbackURL: redirectTo });
    setPending(false);
  }

  return (
    <>
      <form className="space-y-gutter" onSubmit={handleEmail}>
        <div className="space-y-unit">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-unit">
          <div className="flex justify-between items-baseline">
            <Label htmlFor="password" className="mb-0">Password</Label>
            <a className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary" href="#">
              Forgot?
            </a>
          </div>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Continuing…" : "Continue to Portfolio"}
        </Button>
      </form>

      <div className="mt-gutter flex items-center justify-between">
        <span className="border-b border-outline-variant w-1/5" />
        <span className="font-label-caps text-label-caps text-on-surface-variant px-unit">Or</span>
        <span className="border-b border-outline-variant w-1/5" />
      </div>

      <div className="mt-gutter space-y-unit">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleGoogle}
          disabled={pending}
        >
          <MaterialSymbol name="account_circle" opticalSize={20} />
          Continue with Google
        </Button>
      </div>
    </>
  );
}
