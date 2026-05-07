import type { ResumeContent } from "@/lib/resume/types";
import type { AtsScore } from "@/lib/ai/schemas";

/**
 * Deterministic, dependency-free ATS scoring engine.
 * Used as the fast path; LLM-based scoring augments this with semantic match.
 */

const STOP = new Set([
  "and","or","the","a","an","of","to","in","for","on","with","by","at","from","as","is","are","be","this","that",
]);

const QUANT_RE = /(\$\s?\d|[\d,]+\s?(%|percent|years?|months?|hrs?|hours?|k|m|b|million|billion|users?|customers?|fte|seats?|reqs?\/s|qps|tps|x))/i;

const WEAK_VERBS = new Set([
  "responsible","worked","helped","assisted","managed","led","handled","involved","participated",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+#]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function bigrams(tokens: string[]) {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (a && b) out.push(`${a} ${b}`);
  }
  return out;
}

function flattenResume(r: ResumeContent): string {
  return [
    r.fullName,
    r.headline,
    r.summary,
    ...r.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
    ...r.projects.flatMap((p) => [p.name, p.description ?? "", ...p.bullets]),
    ...r.education.flatMap((e) => [e.school, e.degree, e.field ?? "", e.details ?? ""]),
    ...r.skills.flatMap((g) => [g.label, ...g.items]),
    ...r.certifications,
    ...r.awards,
  ]
    .filter(Boolean)
    .join("\n");
}

function bulletList(r: ResumeContent): string[] {
  return [
    ...r.experience.flatMap((e) => e.bullets),
    ...r.projects.flatMap((p) => p.bullets),
  ];
}

function keywordMatchScore(resumeText: string, keywords: string[]) {
  if (keywords.length === 0) return { score: 100, matched: [], missing: [] as string[] };
  const lower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const k of keywords) {
    const present = lower.includes(k.toLowerCase());
    if (present) matched.push(k);
    else missing.push(k);
  }
  const score = Math.round((matched.length / keywords.length) * 100);
  return { score, matched, missing };
}

function quantificationScore(bullets: string[]) {
  if (bullets.length === 0) return 0;
  const withMetrics = bullets.filter((b) => QUANT_RE.test(b)).length;
  return Math.round((withMetrics / bullets.length) * 100);
}

function readabilityScore(resumeText: string, bullets: string[]) {
  const sentences = resumeText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length === 0) return 60;
  const avgWords =
    sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;
  // Sweet spot for resume bullets: 12-22 words / sentence.
  const lengthPenalty = Math.max(0, Math.abs(avgWords - 17) - 5) * 4;

  const weakHits = bullets.filter((b) => {
    const first = b.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    return WEAK_VERBS.has(first);
  }).length;
  const weakPenalty = bullets.length > 0 ? (weakHits / bullets.length) * 40 : 0;

  return Math.max(0, Math.round(100 - lengthPenalty - weakPenalty));
}

function formattingScore(r: ResumeContent) {
  let s = 100;
  if (!r.fullName.trim()) s -= 20;
  if (!r.contact.email) s -= 15;
  if (!r.contact.phone) s -= 5;
  if (r.experience.length === 0) s -= 25;
  if (r.education.length === 0) s -= 10;
  if (r.skills.length === 0) s -= 10;
  if (r.headline === undefined || r.headline.trim() === "") s -= 5;
  return Math.max(0, s);
}

export interface ScoreInput {
  resume: ResumeContent;
  /** Combined keywords from JD analysis. */
  keywords?: string[];
}

export function scoreResume(input: ScoreInput): AtsScore {
  const text = flattenResume(input.resume);
  const tokens = tokenize(text);
  const grams = new Set([...tokens, ...bigrams(tokens)]);

  // If no JD keywords, derive a soft signal from resume's own most-frequent terms (bounded).
  const keywords = input.keywords && input.keywords.length > 0
    ? input.keywords
    : Array.from(grams).slice(0, 0); // empty when no JD

  const km = keywordMatchScore(text, keywords);
  const bullets = bulletList(input.resume);
  const quant = quantificationScore(bullets);
  const fmt = formattingScore(input.resume);
  const read = readabilityScore(text, bullets);

  const overall = Math.round(km.score * 0.4 + quant * 0.25 + fmt * 0.15 + read * 0.2);

  const suggestions: string[] = [];
  if (km.missing.length > 0)
    suggestions.push(
      `Incorporate missing keywords where truthful: ${km.missing.slice(0, 6).join(", ")}.`,
    );
  if (quant < 60)
    suggestions.push("Quantify more bullets — add $, %, time, scale, or growth metrics.");
  if (fmt < 90)
    suggestions.push("Add complete contact details and a clear professional headline.");
  if (read < 70)
    suggestions.push("Tighten verbose bullets and replace weak verbs (managed, worked, helped).");

  return {
    overall,
    keywordMatch: km.score,
    formatting: fmt,
    quantification: quant,
    readability: read,
    matched: km.matched,
    missing: km.missing,
    suggestions,
  };
}
