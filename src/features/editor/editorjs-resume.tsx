"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/icon";
import type { Resume } from "@/db/schema/resumes";
import type { ResumeContent } from "@/lib/resume/types";
import {
  resumeContentToBlocks,
  blocksToResumeContent,
  type EJBlock,
} from "@/lib/resume/blocks";
import { updateResumeContent, snapshotVersion } from "@/features/resumes/actions";
import { cn } from "@/lib/utils";

interface Props {
  resume: Resume;
}

const AUTOSAVE_MS = 1500;

export function EditorJsResume({ resume }: Props) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<unknown>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(resume.content));
  const contentRef = useRef<ResumeContent>(resume.content);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  // Initialize Editor.js on mount.
  useEffect(() => {
    if (!holderRef.current) return;
    let destroyed = false;
    let editor: unknown = null;

    (async () => {
      const [{ default: EditorJS }, { default: Header }, { default: List }, { default: Paragraph }] =
        await Promise.all([
          import("@editorjs/editorjs"),
          import("@editorjs/header"),
          import("@editorjs/list"),
          import("@editorjs/paragraph"),
        ]);

      if (destroyed || !holderRef.current) return;

      const initialBlocks = resumeContentToBlocks(resume.content);

      editor = new EditorJS({
        holder: holderRef.current,
        autofocus: false,
        placeholder: "Start writing…",
        data: { blocks: initialBlocks as never },
        tools: {
          header: {
            class: Header as never,
            inlineToolbar: ["bold", "italic"],
            config: { levels: [1, 2, 3], defaultLevel: 2, placeholder: "Section heading" },
          },
          list: {
            class: List as never,
            inlineToolbar: true,
            config: { defaultStyle: "unordered" },
          },
          paragraph: {
            class: Paragraph as never,
            inlineToolbar: true,
          },
        },
        onChange: scheduleAutosave,
      });
      editorRef.current = editor;
    })();

    return () => {
      destroyed = true;
      const ed = editorRef.current as { destroy?: () => void } | null;
      ed?.destroy?.();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave: read blocks → project to ResumeContent → server action.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const ed = editorRef.current as
        | { save?: () => Promise<{ blocks: EJBlock[] }> }
        | null;
      if (!ed?.save) return;
      try {
        const out = await ed.save();
        const next = blocksToResumeContent(out.blocks ?? [], contentRef.current);
        const serialized = JSON.stringify(next);
        if (serialized === lastSavedRef.current) return;
        contentRef.current = next;
        start(async () => {
          try {
            await updateResumeContent(resume.id, next);
            lastSavedRef.current = serialized;
            setSavedAt(new Date());
          } catch (err) {
            console.error(err);
            toast.error("Autosave failed");
          }
        });
      } catch (err) {
        console.error(err);
      }
    }, AUTOSAVE_MS);
  }

  async function exportPdf() {
    setExporting(true);
    try {
      // Flush any pending edits first.
      const ed = editorRef.current as
        | { save?: () => Promise<{ blocks: EJBlock[] }> }
        | null;
      if (ed?.save) {
        const out = await ed.save();
        const next = blocksToResumeContent(out.blocks ?? [], contentRef.current);
        if (JSON.stringify(next) !== lastSavedRef.current) {
          await updateResumeContent(resume.id, next);
          contentRef.current = next;
          lastSavedRef.current = JSON.stringify(next);
        }
      }

      const res = await fetch(`/api/resumes/${resume.id}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template: "corporate-modern", accent: "#000000", format: "pdf" }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.title || "resume"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF exported");
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end items-center gap-3 mb-6 sticky top-0 z-10 bg-surface-container-lowest py-2">
        <SaveIndicator pending={pending} savedAt={savedAt} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            start(async () => {
              await snapshotVersion(resume.id);
              toast.success("Snapshot saved");
            })
          }
        >
          <MaterialSymbol name="bookmark_add" opticalSize={20} />
          Snapshot
        </Button>
        <Button variant="default" size="sm" onClick={exportPdf} disabled={exporting}>
          <MaterialSymbol
            name={exporting ? "sync" : "download"}
            opticalSize={20}
            className={exporting ? "animate-spin" : ""}
          />
          {exporting ? "Exporting…" : "Export PDF"}
        </Button>
      </div>

      <div ref={holderRef} className="resume-editorjs" />
    </div>
  );
}

function SaveIndicator({ pending, savedAt }: { pending: boolean; savedAt: Date | null }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-label-caps text-label-caps mr-auto",
        pending ? "text-primary" : "text-on-surface-variant",
      )}
    >
      <MaterialSymbol
        name={pending ? "sync" : "check_circle"}
        fill={!pending}
        opticalSize={20}
        className={pending ? "animate-spin" : ""}
      />
      {pending ? "Saving…" : savedAt ? `Saved ${formatTime(savedAt)}` : "Ready"}
    </span>
  );
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
