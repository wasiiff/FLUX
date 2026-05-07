"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/icon";
import type { Resume } from "@/db/schema/resumes";
import { cn } from "@/lib/utils";
import { TEMPLATES, type TemplateId } from "@/lib/resume/templates";

interface Props {
  resumes: Resume[];
}

export function PortfolioGallery({ resumes }: Props) {
  const [selectedResumeId, setSelectedResumeId] = useState(resumes[0]?.id ?? "");
  const [template, setTemplate] = useState<TemplateId>("corporate-modern");
  const [accent, setAccent] = useState("#000000");
  const [exportPending, start] = useTransition();

  const selected = resumes.find((r) => r.id === selectedResumeId);

  function exportPdf() {
    if (!selected) return;
    start(async () => {
      const res = await fetch(`/api/resumes/${selected.id}/export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template, accent, format: "pdf" }),
      });
      if (!res.ok) {
        toast.error("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selected.title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported");
    });
  }

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* Left: template archive */}
      <aside className="w-80 bg-surface border-r border-outline-variant overflow-y-auto shrink-0">
        <div className="p-gutter border-b border-outline-variant">
          <h3 className="font-label-caps text-label-caps text-on-surface">Resumes</h3>
        </div>
        <div className="p-gutter space-y-2">
          {resumes.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Create a resume from the dashboard first.
            </p>
          ) : (
            resumes.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedResumeId(r.id)}
                className={cn(
                  "w-full text-left p-3 border transition-colors",
                  selectedResumeId === r.id
                    ? "border-primary bg-surface-container-low"
                    : "border-outline-variant hover:bg-surface-container-low",
                )}
              >
                <p className="font-data-tabular text-data-tabular text-on-surface">{r.title}</p>
                <p className="font-label-caps text-label-caps text-on-surface-variant mt-1">
                  {r.status.toUpperCase()}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="p-gutter border-t border-outline-variant mt-4">
          <h3 className="font-label-caps text-label-caps text-on-surface mb-4">
            Template Archive
          </h3>
          <div className="space-y-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className="w-full text-left group"
              >
                <div
                  className={cn(
                    "border p-2 mb-2 transition-colors",
                    template === t.id
                      ? "border-primary bg-surface-container-highest"
                      : "border-outline-variant bg-surface group-hover:border-on-surface-variant",
                  )}
                >
                  <div className="h-32 bg-surface-container-lowest border border-outline-variant relative overflow-hidden">
                    <div className="absolute top-3 left-3 right-3 h-2 bg-outline-variant opacity-40" />
                    <div className="absolute top-7 left-3 right-1/2 h-1.5 bg-outline-variant opacity-30" />
                    <div className="absolute top-12 left-3 right-3 h-px bg-outline-variant" />
                    <div className="absolute top-14 left-3 right-3 space-y-1">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-1 bg-outline-variant opacity-20" />
                      ))}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "font-body-md text-body-md",
                    template === t.id ? "text-primary" : "text-on-surface",
                  )}
                >
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Center: preview */}
      <section className="flex-1 bg-surface-container-low p-section-gap overflow-y-auto flex justify-center items-start">
        <div className="w-[850px] bg-surface-container-lowest border border-outline-variant p-[64px] min-h-[1100px]">
          {selected ? (
            <ResumePreview resume={selected} accent={accent} />
          ) : (
            <p className="text-on-surface-variant">Select a resume to preview.</p>
          )}
        </div>
      </section>

      {/* Right: typography & color */}
      <aside className="w-80 bg-surface border-l border-outline-variant flex flex-col shrink-0">
        <div className="p-gutter border-b border-outline-variant">
          <h3 className="font-label-caps text-label-caps text-on-surface">Typography &amp; Color</h3>
        </div>
        <div className="flex-1 p-gutter space-y-8 overflow-y-auto">
          <div>
            <Label>Primary Accent</Label>
            <div className="flex gap-2 mt-2">
              {["#000000", "#2c3e50", "#34495e", "#6d3bd7"].map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "w-8 h-8 border focus:outline-none",
                    accent === c ? "border-2 border-outline" : "border-outline-variant",
                  )}
                  aria-label={`Accent ${c}`}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>Body Font Size</Label>
            <div className="flex items-center gap-4">
              <span className="font-body-md text-on-surface-variant text-sm">A</span>
              <input
                type="range"
                min={1}
                max={3}
                defaultValue={2}
                className="w-full h-1 bg-outline-variant appearance-none cursor-pointer"
              />
              <span className="font-body-md text-on-surface-variant text-lg">A</span>
            </div>
          </div>
        </div>

        <div className="p-gutter border-t border-outline-variant bg-surface-container-low space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={exportPdf}
            disabled={!selected || exportPending}
          >
            <MaterialSymbol name="picture_as_pdf" opticalSize={20} />
            {exportPending ? "Exporting…" : "Export PDF"}
          </Button>
          <Button variant="outline" className="w-full" size="lg" disabled>
            Download DOCX
          </Button>
        </div>
      </aside>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-label-caps text-label-caps text-on-surface mb-2">{children}</label>
  );
}

function ResumePreview({ resume, accent }: { resume: Resume; accent: string }) {
  const c = resume.content;
  return (
    <div>
      <header
        className="border-b-2 pb-8 mb-8 text-center"
        style={{ borderColor: accent }}
      >
        <h1 className="font-h1 text-h1 mb-2" style={{ color: accent }}>
          {c.fullName}
        </h1>
        {c.headline ? (
          <p className="font-body-lg text-body-lg text-on-surface-variant">{c.headline}</p>
        ) : null}
      </header>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-12">
          {c.summary ? (
            <section>
              <h2
                className="font-h3 text-h3 mb-4 border-b border-outline-variant pb-2"
                style={{ color: accent }}
              >
                Executive Summary
              </h2>
              <p className="font-body-md text-body-md text-on-surface">{c.summary}</p>
            </section>
          ) : null}
          {c.experience.length > 0 ? (
            <section>
              <h2
                className="font-h3 text-h3 mb-4 border-b border-outline-variant pb-2"
                style={{ color: accent }}
              >
                Professional Experience
              </h2>
              {c.experience.map((e) => (
                <div key={e.id} className="mb-6">
                  <h3 className="font-label-caps text-label-caps text-on-surface mb-1">
                    {e.company}
                  </h3>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="font-body-md text-body-md text-on-surface-variant italic">
                      {e.role}
                    </p>
                    <p className="font-data-tabular text-data-tabular text-on-surface-variant">
                      {e.startDate} - {e.endDate ?? "Present"}
                    </p>
                  </div>
                  <ul className="list-disc list-inside font-body-md text-body-md text-on-surface space-y-2">
                    {e.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}
        </div>
        <div className="col-span-4 space-y-12 pl-6 border-l border-outline-variant">
          {c.skills.length > 0 ? (
            <section>
              <h2
                className="font-h3 text-h3 mb-4 border-b border-outline-variant pb-2"
                style={{ color: accent }}
              >
                Core Competencies
              </h2>
              <ul className="font-body-md text-body-md text-on-surface space-y-2">
                {c.skills.flatMap((g) => g.items).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {c.education.length > 0 ? (
            <section>
              <h2
                className="font-h3 text-h3 mb-4 border-b border-outline-variant pb-2"
                style={{ color: accent }}
              >
                Education
              </h2>
              {c.education.map((e) => (
                <div key={e.id} className="mb-3">
                  <p className="font-data-tabular text-data-tabular">{e.school}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{e.degree}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
