"use client";

import { useState, useTransition } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MaterialSymbol } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/input";
import type { Resume } from "@/db/schema/resumes";
import type { AtsScore as DbAtsScore } from "@/db/schema/jobs";
import { cn } from "@/lib/utils";

interface Props {
  resume: Resume;
  score: DbAtsScore | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function StrategicAnalysisPanel({ resume, score: initialScore }: Props) {
  const [jd, setJd] = useState("");
  const [pending, start] = useTransition();
  const { data, mutate } = useSWR<{ score: DbAtsScore | null }>(
    `/api/resumes/${resume.id}/score`,
    fetcher,
    { fallbackData: { score: initialScore } },
  );
  const score = data?.score ?? initialScore;

  function runScore() {
    start(async () => {
      await fetch(`/api/resumes/${resume.id}/score`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescription: jd }),
      });
      mutate();
    });
  }

  function level(n: number): { label: string; tone: "ok" | "warn" | "low" } {
    if (n >= 80) return { label: "Optimal", tone: "ok" };
    if (n >= 50) return { label: "Moderate", tone: "warn" };
    return { label: "Low", tone: "low" };
  }

  return (
    <>
      <div className="p-6 border-b border-outline-variant bg-surface-container-low">
        <h2 className="font-h3 text-h3 text-primary flex items-center gap-2">
          <MaterialSymbol name="troubleshoot" opticalSize={24} />
          Strategic Analysis
        </h2>
        <p className="font-label-caps text-label-caps text-on-surface-variant mt-2">
          Target Role: {resume.targetRole ?? "—"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Score breakdown */}
        <section>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant pb-2 mb-4">
            ATS SCORE
          </h3>
          {score ? (
            <div className="space-y-4">
              <Bar label="Overall" value={score.overall} />
              <Bar label="Keyword Match" value={score.keywordMatch} />
              <Bar label="Quantification" value={score.quantification} />
              <Bar label="Formatting" value={score.formatting} />
              <Bar label="Readability" value={score.readability} />
            </div>
          ) : (
            <p className="font-body-md text-on-surface-variant">
              Run the scorer to see ATS metrics.
            </p>
          )}
        </section>

        {/* Run analysis */}
        <section>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant pb-2 mb-4">
            JOB DESCRIPTION
          </h3>
          <Textarea
            rows={6}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the target job description to score against…"
          />
          <Button
            variant="ai"
            className="w-full mt-3"
            onClick={runScore}
            disabled={pending || jd.trim().length === 0}
          >
            <MaterialSymbol name="auto_awesome" opticalSize={20} />
            {pending ? "Analyzing…" : "Run Strategic Analysis"}
          </Button>
        </section>

        {/* Suggestions */}
        {score?.breakdown?.suggestions?.length ? (
          <section>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant pb-2 mb-4">
              REFINEMENT SUGGESTIONS
            </h3>
            <ul className="space-y-3">
              {score.breakdown.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="border border-outline-variant bg-surface-container-lowest p-4 font-body-md text-body-md text-on-surface"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Missing keywords */}
        {score?.breakdown?.missing?.length ? (
          <section>
            <h3 className="font-label-caps text-label-caps text-on-surface-variant border-b border-outline-variant pb-2 mb-4">
              MISSING KEYWORDS
            </h3>
            <div className="flex flex-wrap gap-2">
              {score.breakdown.missing.slice(0, 16).map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center px-2 py-1 border border-error text-on-error-container bg-error-container/30 font-label-caps text-label-caps"
                >
                  {k}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const tone = value >= 80 ? "ok" : value >= 50 ? "warn" : "low";
  return (
    <div>
      <div className="flex justify-between font-data-tabular text-data-tabular mb-1">
        <span className="text-on-surface">{label}</span>
        <span
          className={cn(
            tone === "ok" && "text-on-surface-variant",
            tone === "warn" && "text-on-surface-variant",
            tone === "low" && "text-error",
          )}
        >
          {value}
        </span>
      </div>
      <Progress value={value} variant={tone === "low" ? "error" : "default"} />
    </div>
  );
}
