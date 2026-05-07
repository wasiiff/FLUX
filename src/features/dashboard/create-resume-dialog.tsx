"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createResume } from "@/features/resumes/actions";

export function CreateResumeDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function handleSubmit(formData: FormData) {
    start(async () => {
      await createResume(formData);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Resume</DialogTitle>
          <DialogDescription>
            Name your document and (optionally) a target role to begin.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-gutter mt-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Chief Operating Officer · v1" required />
          </div>
          <div>
            <Label htmlFor="targetRole">Target Role (optional)</Label>
            <Input id="targetRole" name="targetRole" placeholder="e.g. SVP Operations" />
          </div>
          <DialogFooter className="!flex-row !justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
