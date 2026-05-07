"use client";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md",
          title: "font-data-tabular text-data-tabular text-primary",
          description: "text-body-md text-on-surface-variant",
        },
      }}
    />
  );
}
