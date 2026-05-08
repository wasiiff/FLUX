"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialSymbol } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import type { Resume } from "@/db/schema/resumes";
import { cn } from "@/lib/utils";

type Stage = "idle" | "uploading" | "extracting" | "analyzing" | "rewriting" | "scoring" | "done" | "error";
type Mode = "existing" | "upload";

interface Props {
  resumes: Resume[];
}

const MAX_PDF_BYTES = 8 * 1024 * 1024;

export function OptimizeWorkspace({ resumes }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(resumes.length > 0 ? "existing" : "upload");
  const [resumeId, setResumeId] = useState<string>(resumes[0]?.id ?? "");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ score?: number; missing?: string[]; resumeId?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stages: { key: Stage; label: string; description: string }[] =
    mode === "upload"
      ? [
          { key: "uploading", label: "Document Ingestion", description: "Parsing PDF and extracting structured content." },
          { key: "analyzing", label: "Mapping Achievements", description: "Quantifying impact metrics and strategic initiatives." },
          { key: "rewriting", label: "Aligning Narrative", description: "Rewriting bullets to mirror target competencies." },
          { key: "scoring", label: "Computing ATS Score", description: "Evaluating keyword match, quantification, formatting, readability." },
        ]
      : [
          { key: "extracting", label: "Document Ingestion", description: "Parsing structural formatting and chronological history." },
          { key: "analyzing", label: "Mapping Achievements", description: "Quantifying impact metrics and strategic initiatives." },
          { key: "rewriting", label: "Aligning Narrative", description: "Rewriting bullets to mirror target competencies." },
          { key: "scoring", label: "Computing ATS Score", description: "Evaluating keyword match, quantification, formatting, readability." },
        ];

  const stageIndex = (s: Stage) => stages.findIndex((x) => x.key === s);

  function pickFile(f: File | null) {
    if (!f) {
      setFile(null);
      return;
    }
    if (f.type && f.type !== "application/pdf") {
      toast.error("PDF only");
      return;
    }
    if (f.size > MAX_PDF_BYTES) {
      toast.error("PDF must be ≤ 8 MB");
      return;
    }
    setFile(f);
  }

  function run() {
    if (jd.trim().length < 20) {
      toast.error("Paste a job description (≥ 20 characters)");
      return;
    }
    if (mode === "existing" && !resumeId) {
      toast.error("Select a resume first");
      return;
    }
    if (mode === "upload" && !file) {
      toast.error("Upload your resume PDF");
      return;
    }

    start(async () => {
      try {
        if (mode === "upload" && file) {
          setStage("uploading");
          const fd = new FormData();
          fd.set("file", file);
          fd.set("jobDescription", jd);
          if (role) fd.set("targetRole", role);
          fd.set("title", file.name.replace(/\.pdf$/i, ""));

          setStage("analyzing");
          const res = await fetch("/api/resumes/import", { method: "POST", body: fd });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j.message || j.error || "Import failed");
          }
          setStage("rewriting");
          const json = await res.json();
          setStage("scoring");
          await wait(250);
          setResult({
            score: json.score?.overall,
            missing: json.score?.missing,
            resumeId: json.resumeId,
          });
          setStage("done");
          toast.success("Resume created — opening editor");
          router.push(`/editor/${json.resumeId}`);
          return;
        }

        // Existing-resume flow
        setStage("extracting");
        await wait(300);
        setStage("analyzing");
        const res = await fetch(`/api/resumes/${resumeId}/optimize`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jobDescription: jd, targetRole: role }),
        });
        if (!res.ok) throw new Error(await res.text());
        setStage("rewriting");
        const json = await res.json();
        setStage("scoring");
        await wait(250);
        setResult({
          score: json.score?.overall,
          missing: json.score?.missing,
          resumeId,
        });
        setStage("done");
        toast.success("Optimization complete");
      } catch (err) {
        console.error(err);
        setStage("error");
        toast.error(err instanceof Error ? err.message : "Optimization failed");
      }
    });
  }

  return (
    <main className="flex-1 py-margin px-margin grid grid-cols-1 lg:grid-cols-12 gap-gutter max-w-[var(--spacing-container-max)] mx-auto w-full">
      <header className="col-span-full mb-8">
        <h1 className="font-h1 text-h1 text-primary mb-2">Optimization Workspace</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Refine and align your professional narrative with targeted industry opportunities.
        </p>
      </header>

      {/* Inputs */}
      <div className="col-span-1 lg:col-span-8 flex flex-col gap-8">
        <section className="border border-outline-variant bg-surface-container-lowest p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-h3 text-h3 text-primary">Source Material</h2>
            <Badge variant="outline">Step 1</Badge>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="existing" disabled={resumes.length === 0}>
                <MaterialSymbol name="folder_open" opticalSize={18} className="mr-2" />
                Pick existing
              </TabsTrigger>
              <TabsTrigger value="upload">
                <MaterialSymbol name="upload_file" opticalSize={18} className="mr-2" />
                Upload PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing">
              <Label>Choose Resume</Label>
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full bg-surface-container-low border-b border-outline-variant py-3 px-4 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary"
              >
                {resumes.length === 0 ? (
                  <option value="">No resumes yet — upload a PDF instead</option>
                ) : (
                  resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))
                )}
              </select>
            </TabsContent>

            <TabsContent value="upload">
              <Label>Resume PDF</Label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFile(e.dataTransfer.files[0] ?? null);
                }}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "border border-dashed border-outline-variant bg-surface-container-low p-8 text-center cursor-pointer hover:border-primary transition-colors",
                  file && "border-primary",
                )}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <MaterialSymbol name="picture_as_pdf" opticalSize={24} className="text-primary" />
                    <div className="text-left">
                      <p className="font-body-md text-body-md text-on-surface">{file.name}</p>
                      <p className="font-label-caps text-label-caps text-on-surface-variant">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        pickFile(null);
                      }}
                    >
                      <MaterialSymbol name="close" opticalSize={18} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <MaterialSymbol name="cloud_upload" opticalSize={32} className="text-on-surface-variant" />
                    <p className="font-body-md text-body-md text-on-surface">
                      Drop PDF here or click to browse
                    </p>
                    <p className="font-label-caps text-label-caps text-on-surface-variant">
                      PDF only · max 8 MB
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <section className="border border-outline-variant bg-surface-container-lowest p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-h3 text-h3 text-primary">Target Role Parameters</h2>
            <Badge variant="outline">Step 2</Badge>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <Label>Role Title</Label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Chief Operating Officer"
              />
            </div>
            <div>
              <Label>Job Description / Scope</Label>
              <Textarea
                rows={8}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the target job description or core requirements here…"
                maxLength={5000}
              />
              <p className="font-label-caps text-label-caps text-on-surface-variant mt-2 text-right">
                {jd.length} / 5000 chars
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            size="lg"
            variant="ai"
            onClick={run}
            disabled={pending || (mode === "existing" && !resumeId) || (mode === "upload" && !file)}
          >
            {pending
              ? "Running…"
              : mode === "upload"
                ? "Generate ATS Resume"
                : "Initialize Optimization"}
            <MaterialSymbol name="arrow_forward" opticalSize={20} />
          </Button>
        </div>
      </div>

      {/* Progress panel */}
      <div className="col-span-1 lg:col-span-4">
        <div className="border border-outline-variant bg-surface-container-low p-6 sticky top-24">
          <h3 className="font-h3 text-h3 text-primary mb-6 border-b border-outline-variant pb-4">
            Strategic Extraction
          </h3>
          <div className="flex flex-col gap-6">
            {stages.map((s, i) => {
              const cur = stageIndex(stage);
              const state =
                stage === "done" || cur > i ? "done" : cur === i ? "active" : "pending";
              return (
                <StageRow
                  key={s.key}
                  state={state}
                  label={s.label}
                  description={s.description}
                  isLast={i === stages.length - 1}
                />
              );
            })}
          </div>

          {stage === "done" && result?.score != null ? (
            <div className="mt-8 pt-6 border-t border-outline-variant">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                Final Score
              </p>
              <div className="font-h1 text-h1 text-primary">{result.score}</div>
              {result.missing && result.missing.length > 0 ? (
                <div className="mt-4">
                  <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                    Still Missing
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.missing.slice(0, 8).map((k) => (
                      <span
                        key={k}
                        className="px-2 py-0.5 border border-outline-variant font-label-caps text-label-caps text-on-surface-variant"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {result.resumeId ? (
                <Button
                  variant="ai"
                  size="sm"
                  className="mt-6 w-full"
                  onClick={() => router.push(`/editor/${result.resumeId}`)}
                >
                  Open in Editor
                  <MaterialSymbol name="arrow_forward" opticalSize={18} />
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 pt-6 border-t border-outline-variant">
            <div className="bg-surface p-4 border border-outline-variant flex items-start gap-3">
              <MaterialSymbol name="info" opticalSize={20} className="text-primary shrink-0" />
              <p className="font-body-md text-body-md text-on-surface-variant">
                {mode === "upload"
                  ? "Upload your existing PDF and a target JD. We'll parse, restructure, and align it for ATS — then open it in the live editor."
                  : "Pick an existing resume and target JD. We'll align it for ATS — then return a score and missing keywords."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StageRow({
  label,
  description,
  state,
  isLast,
}: {
  label: string;
  description: string;
  state: "pending" | "active" | "done";
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
            state === "done" && "bg-primary text-on-primary",
            state === "active" && "border-2 border-primary bg-surface",
            state === "pending" && "border border-outline-variant bg-surface",
          )}
        >
          {state === "done" ? (
            <MaterialSymbol name="check" opticalSize={20} />
          ) : state === "active" ? (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          ) : null}
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-px flex-1 mt-2",
              state === "done" ? "bg-primary" : "bg-outline-variant",
            )}
          />
        )}
      </div>
      <div className="pb-6">
        <p
          className={cn(
            "font-data-tabular text-data-tabular mb-1",
            state === "pending" ? "text-on-surface-variant" : "text-primary",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "font-body-md text-body-md text-sm",
            state === "pending" ? "text-outline" : "text-on-surface-variant",
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
