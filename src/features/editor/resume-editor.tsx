"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editable } from "@/components/ui/editable";
import { MaterialSymbol } from "@/components/ui/icon";
import type { Resume } from "@/db/schema/resumes";
import type { ResumeContent, ExperienceItem } from "@/lib/resume/types";
import { updateResumeContent, snapshotVersion } from "@/features/resumes/actions";
import { cn } from "@/lib/utils";

interface Props {
  resume: Resume;
}

export function ResumeEditor({ resume }: Props) {
  const [content, setContent] = useState<ResumeContent>(resume.content);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Debounced autosave.
  useEffect(() => {
    const t = setTimeout(() => {
      start(async () => {
        try {
          await updateResumeContent(resume.id, content);
          setSavedAt(new Date());
        } catch {
          toast.error("Autosave failed");
        }
      });
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const update = useCallback(
    <K extends keyof ResumeContent>(key: K, value: ResumeContent[K]) =>
      setContent((c) => ({ ...c, [key]: value })),
    [],
  );

  const updateExperience = (id: string, patch: Partial<ExperienceItem>) =>
    setContent((c) => ({
      ...c,
      experience: c.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const addExperience = () =>
    setContent((c) => ({
      ...c,
      experience: [
        ...c.experience,
        { id: nanoid(8), company: "", role: "", bullets: [""], startDate: "", endDate: "" },
      ],
    }));

  const removeExperience = (id: string) =>
    setContent((c) => ({ ...c, experience: c.experience.filter((e) => e.id !== id) }));

  const addEducation = () =>
    setContent((c) => ({
      ...c,
      education: [
        ...c.education,
        { id: nanoid(8), school: "", degree: "", startDate: "", endDate: "" },
      ],
    }));

  const updateEducation = (id: string, patch: Partial<ResumeContent["education"][number]>) =>
    setContent((c) => ({
      ...c,
      education: c.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));

  const removeEducation = (id: string) =>
    setContent((c) => ({ ...c, education: c.education.filter((e) => e.id !== id) }));

  return (
    <div className="space-y-12">
      <div className="flex justify-end items-center gap-3 mb-2">
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
          Snapshot Version
        </Button>
      </div>

      {/* Header */}
      <div className="border-b border-outline-variant pb-8 mb-8">
        <Editable
          as="h1"
          value={content.fullName}
          onChange={(v) => update("fullName", v)}
          className="font-h1 text-h1 text-primary mb-4"
          placeholder="Your Name"
        />
        <Editable
          as="p"
          value={content.headline ?? ""}
          onChange={(v) => update("headline", v)}
          className="font-body-lg text-body-lg text-on-surface-variant mb-6"
          placeholder="Title | Specialization | Industry"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 font-data-tabular text-data-tabular text-on-surface-variant">
          <Input
            value={content.contact.email ?? ""}
            onChange={(e) => update("contact", { ...content.contact, email: e.target.value })}
            placeholder="email@example.com"
            className="h-9"
          />
          <Input
            value={content.contact.phone ?? ""}
            onChange={(e) => update("contact", { ...content.contact, phone: e.target.value })}
            placeholder="+1 555 0100"
            className="h-9"
          />
          <Input
            value={content.contact.location ?? ""}
            onChange={(e) => update("contact", { ...content.contact, location: e.target.value })}
            placeholder="New York, NY"
            className="h-9"
          />
        </div>
      </div>

      {/* Summary */}
      <Section title="Executive Summary">
        <div className="bg-surface-container-low p-8 border-l border-primary">
          <Editable
            as="p"
            multiline
            value={content.summary ?? ""}
            onChange={(v) => update("summary", v)}
            className="font-body-md text-body-md text-on-surface leading-relaxed block min-h-[60px]"
            placeholder="Two to four sentences capturing your strategic positioning, scale of impact, and signature outcomes."
          />
        </div>
      </Section>

      {/* Experience */}
      <Section
        title="Professional Experience"
        action={
          <Button variant="ghost" size="sm" onClick={addExperience}>
            <MaterialSymbol name="add" opticalSize={20} />
            Add role
          </Button>
        }
      >
        {content.experience.length === 0 ? (
          <p className="text-on-surface-variant font-body-md italic">
            No roles yet. Click <em>Add role</em> to begin.
          </p>
        ) : (
          content.experience.map((e) => (
            <div key={e.id} className="mb-8 group">
              <div className="flex justify-between items-baseline mb-2 gap-3">
                <Editable
                  as="h3"
                  value={e.company}
                  onChange={(v) => updateExperience(e.id, { company: v })}
                  className="font-h3 text-h3 text-primary flex-1"
                  placeholder="Company"
                />
                <div className="flex items-center gap-3 shrink-0">
                  <Editable
                    as="span"
                    value={`${e.startDate ?? ""}${e.startDate || e.endDate ? " – " : ""}${e.endDate ?? "Present"}`}
                    onChange={(v) => {
                      const [s, x] = v.split("–").map((p) => p.trim());
                      updateExperience(e.id, { startDate: s ?? "", endDate: x ?? "Present" });
                    }}
                    className="font-data-tabular text-data-tabular text-on-surface-variant"
                    placeholder="2018 – Present"
                  />
                  <button
                    onClick={() => removeExperience(e.id)}
                    className="opacity-0 group-hover:opacity-100 text-error transition-opacity"
                    aria-label="Remove role"
                  >
                    <MaterialSymbol name="delete" opticalSize={20} />
                  </button>
                </div>
              </div>
              <Editable
                as="h4"
                value={e.role}
                onChange={(v) => updateExperience(e.id, { role: v })}
                className="font-label-caps text-label-caps text-on-surface-variant mb-4 block"
                placeholder="ROLE TITLE"
              />
              <BulletList
                bullets={e.bullets}
                onChange={(bullets) => updateExperience(e.id, { bullets })}
              />
            </div>
          ))
        )}
      </Section>

      {/* Education */}
      <Section
        title="Education"
        action={
          <Button variant="ghost" size="sm" onClick={addEducation}>
            <MaterialSymbol name="add" opticalSize={20} />
            Add degree
          </Button>
        }
      >
        {content.education.length === 0 ? (
          <p className="text-on-surface-variant font-body-md italic">
            No degrees yet. Click <em>Add degree</em> to begin.
          </p>
        ) : (
          content.education.map((edu) => (
            <div key={edu.id} className="mb-6 group flex justify-between items-baseline gap-3">
              <div className="flex-1">
                <Editable
                  as="h3"
                  value={edu.school}
                  onChange={(v) => updateEducation(edu.id, { school: v })}
                  className="font-h3 text-h3 text-primary"
                  placeholder="School"
                />
                <Editable
                  as="p"
                  value={edu.degree}
                  onChange={(v) => updateEducation(edu.id, { degree: v })}
                  className="font-body-md text-body-md text-on-surface mt-1"
                  placeholder="Degree"
                />
              </div>
              <Editable
                as="span"
                value={edu.endDate ?? edu.startDate ?? ""}
                onChange={(v) => updateEducation(edu.id, { endDate: v })}
                className="font-data-tabular text-data-tabular text-on-surface-variant"
                placeholder="2012"
              />
              <button
                onClick={() => removeEducation(edu.id)}
                className="opacity-0 group-hover:opacity-100 text-error transition-opacity"
                aria-label="Remove degree"
              >
                <MaterialSymbol name="delete" opticalSize={20} />
              </button>
            </div>
          ))
        )}
      </Section>
    </div>
  );
}

function SaveIndicator({ pending, savedAt }: { pending: boolean; savedAt: Date | null }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-label-caps text-label-caps",
        pending ? "text-primary" : "text-on-surface-variant",
      )}
    >
      <MaterialSymbol
        name={pending ? "sync" : "check_circle"}
        fill={!pending}
        opticalSize={20}
        className={pending ? "animate-spin" : ""}
      />
      {pending ? "Saving…" : savedAt ? "All changes saved" : "Ready"}
    </span>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-h2 text-h2 text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function BulletList({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
}) {
  return (
    <ul className="list-disc list-outside ml-4 font-body-md text-body-md text-on-surface space-y-3">
      {bullets.map((b, i) => (
        <li key={i} className="group/item flex items-start gap-2">
          <Editable
            as="span"
            multiline
            value={b}
            onChange={(v) => {
              const next = [...bullets];
              next[i] = v;
              onChange(next);
            }}
            placeholder="Quantified outcome…"
            className="block flex-1"
          />
          <button
            onClick={() => onChange(bullets.filter((_, j) => j !== i))}
            className="opacity-0 group-hover/item:opacity-100 text-error transition-opacity"
            aria-label="Remove bullet"
          >
            <MaterialSymbol name="close" opticalSize={16} />
          </button>
        </li>
      ))}
      <li className="list-none ml-[-1rem]">
        <button
          onClick={() => onChange([...bullets, ""])}
          className="font-label-caps text-label-caps text-primary hover:underline"
        >
          + Add bullet
        </button>
      </li>
    </ul>
  );
}
