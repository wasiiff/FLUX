"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { signUp } from "@/lib/auth/client";

export function SignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPending(true);
    const res = await signUp.email({ name, email, password, callbackURL: "/dashboard" });
    setPending(false);
    if (res.error) {
      toast.error(res.error.message ?? "Sign-up failed");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-gutter" onSubmit={handleSubmit}>
      <div className="space-y-unit">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="space-y-unit">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-unit">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
        <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">
          Minimum 8 characters
        </p>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Provisioning…" : "Create Strategy Suite"}
      </Button>
    </form>
  );
}
