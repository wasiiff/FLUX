"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MaterialSymbol } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import type { Resume } from "@/db/schema/resumes";
import { cn } from "@/lib/utils";

type Stage = "idle" | "extracting" | "analyzing" | "rewriting" | "scoring" | "done" | "error";

interface Props {
  resumes: Resume[];
}

export function OptimizeWorkspace({ resumes }: Props) {
  const [resumeId, setResumeId] = useState<string>(resumes[0]?.id ?? "");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ score?: number; missing?: string[] } | null>(null);

  const stages: { key: Stage; label: string; description: string }[] = [
    { key: "extracting", label: "Document Ingestion", description: "Parsing structural formatting and chronological history." },
    { key: "analyzing", label: "Mapping Executive Achievements", description: "Quantifying impact metrics and strategic initiatives." },
    { key: "rewriting", label: "Aligning Narrative", description: "Rewriting bullets to mirror target competencies." },
    { key: "scoring", label: "Computing ATS Score", description: "Evaluating across keyword match, quantification, formatting, readability." },
  ];

  const stageIndex = (s: Stage) => stages.findIndex((x) => x.key === s);

  function run() {
    if (!resumeId || !jd.trim()) {
      toast.error("Select a resume and paste a job description");
      return;
    }

    start(async () => {
      try {
        setStage("extracting");
        await wait(400);
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
        await wait(300);
        setResult({ score: json.score?.overall, missing: json.score?.missing });
        setStage("done");
        toast.success("Optimization complete");
      } catch (err) {
        console.error(err);
        setStage("error");
        toast.error("Optimization failed");
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
          <div>
            <Label>Choose Resume</Label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="w-full bg-surface-container-low border-b border-outline-variant py-3 px-4 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary"
            >
              {resumes.length === 0 ? (
                <option value="">No resumes yet — create one first</option>
              ) : (
                resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))
              )}
            </select>
          </div>
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
              />
              <p className="font-label-caps text-label-caps text-on-surface-variant mt-2 text-right">
                {jd.length} / 5000 chars
              </p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button size="lg" variant="ai" onClick={run} disabled={pending || !resumeId}>
            {pending ? "Running…" : "Initialize Optimization"}
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
                <StageRow key={s.key} state={state} {...s} isLast={i === stages.length - 1} />
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
            </div>
          ) : null}

          <div className="mt-8 pt-6 border-t border-outline-variant">
            <div className="bg-surface p-4 border border-outline-variant flex items-start gap-3">
              <MaterialSymbol name="info" opticalSize={20} className="text-primary shrink-0" />
              <p className="font-body-md text-body-md text-on-surface-variant">
                The extraction engine requires both source material and target parameters to begin
                the gap analysis phase.
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
