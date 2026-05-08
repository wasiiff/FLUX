import { nanoid } from "nanoid";
import type {
  ResumeContent,
  ExperienceItem,
  EducationItem,
  ProjectItem,
  SkillGroup,
} from "./types";
import { emptyResume } from "./types";

/**
 * Editor.js OutputBlockData (subset we care about).
 * We deliberately don't import @editorjs/editorjs here so this module
 * stays usable on the server.
 */
export interface EJBlock {
  id?: string;
  type: string;
  data: Record<string, unknown>;
}

export interface EJData {
  time?: number;
  blocks: EJBlock[];
  version?: string;
}

/* ---------- section markers ---------- */

const SECTIONS = {
  summary: "Executive Summary",
  experience: "Professional Experience",
  education: "Education",
  projects: "Projects",
  skills: "Core Competencies",
  certifications: "Certifications",
  awards: "Awards",
} as const;

type SectionKey = keyof typeof SECTIONS;

/* ===== ResumeContent → Editor.js blocks ===== */

export function resumeContentToBlocks(content: ResumeContent): EJBlock[] {
  const blocks: EJBlock[] = [];

  blocks.push(h(1, content.fullName || "Your Name"));
  if (content.headline) blocks.push(p(content.headline, { kind: "headline" }));

  const contactLine = formatContactLine(content);
  if (contactLine) blocks.push(p(contactLine, { kind: "contact" }));

  if (content.summary) {
    blocks.push(h(2, SECTIONS.summary));
    blocks.push(p(content.summary, { kind: "summary" }));
  }

  if (content.experience.length) {
    blocks.push(h(2, SECTIONS.experience));
    for (const e of content.experience) {
      blocks.push(h(3, e.company || "Company", { kind: "exp-company", refId: e.id }));
      const meta = [
        e.role,
        formatDateRange(e.startDate, e.endDate),
        e.location,
      ]
        .filter(Boolean)
        .join(" · ");
      if (meta) blocks.push(p(meta, { kind: "exp-meta", refId: e.id }));
      if (e.bullets.length) {
        blocks.push({
          type: "list",
          data: {
            style: "unordered",
            items: e.bullets.map((b) => b),
            meta: { kind: "exp-bullets", refId: e.id },
          },
        });
      }
    }
  }

  if (content.education.length) {
    blocks.push(h(2, SECTIONS.education));
    for (const ed of content.education) {
      blocks.push(h(3, ed.school || "School", { kind: "edu-school", refId: ed.id }));
      const meta = [
        ed.degree,
        ed.field,
        formatDateRange(ed.startDate, ed.endDate),
      ]
        .filter(Boolean)
        .join(" · ");
      if (meta) blocks.push(p(meta, { kind: "edu-meta", refId: ed.id }));
      if (ed.details) blocks.push(p(ed.details, { kind: "edu-details", refId: ed.id }));
    }
  }

  if (content.projects.length) {
    blocks.push(h(2, SECTIONS.projects));
    for (const pr of content.projects) {
      blocks.push(h(3, pr.name || "Project", { kind: "proj-name", refId: pr.id }));
      if (pr.description) blocks.push(p(pr.description, { kind: "proj-desc", refId: pr.id }));
      if (pr.bullets.length) {
        blocks.push({
          type: "list",
          data: {
            style: "unordered",
            items: pr.bullets,
            meta: { kind: "proj-bullets", refId: pr.id },
          },
        });
      }
    }
  }

  if (content.skills.length) {
    blocks.push(h(2, SECTIONS.skills));
    for (const g of content.skills) {
      const text = `${g.label}: ${g.items.join(", ")}`;
      blocks.push(p(text, { kind: "skill-group", refId: g.id }));
    }
  }

  if (content.certifications.length) {
    blocks.push(h(2, SECTIONS.certifications));
    blocks.push({
      type: "list",
      data: { style: "unordered", items: content.certifications, meta: { kind: "certifications" } },
    });
  }

  if (content.awards.length) {
    blocks.push(h(2, SECTIONS.awards));
    blocks.push({
      type: "list",
      data: { style: "unordered", items: content.awards, meta: { kind: "awards" } },
    });
  }

  return blocks;
}

/* ===== Editor.js blocks → ResumeContent ===== */

export function blocksToResumeContent(
  blocks: EJBlock[],
  prev: ResumeContent,
): ResumeContent {
  const out: ResumeContent = emptyResume(prev.fullName);
  out.contact = { ...prev.contact };

  // Header phase: blocks before first H2.
  let i = 0;
  let firstH2 = blocks.findIndex((b) => b.type === "header" && level(b) === 2);
  if (firstH2 < 0) firstH2 = blocks.length;

  // Name = first H1 (or first header). Fallback: prev.fullName.
  const nameBlock = blocks
    .slice(0, firstH2)
    .find((b) => b.type === "header" && level(b) === 1);
  out.fullName = nameBlock ? plain(nameBlock.data.text) || prev.fullName : prev.fullName;

  // Headline = first paragraph after the H1 (if not contact-shaped); contact = paragraph that looks like contacts.
  const headerParas = blocks
    .slice(0, firstH2)
    .filter((b) => b.type === "paragraph")
    .map((b) => plain(b.data.text));

  for (const text of headerParas) {
    if (looksLikeContact(text)) {
      mergeContactFromText(out, text);
    } else if (!out.headline) {
      out.headline = text;
    }
  }

  // Body phase: walk H2 sections.
  i = firstH2;
  while (i < blocks.length) {
    const head = blocks[i];
    if (!head || head.type !== "header" || level(head) !== 2) {
      i++;
      continue;
    }
    const title = plain(head.data.text).trim().toLowerCase();
    const sectionKey = matchSection(title);

    // Slice until next H2 (or end).
    const end = blocks
      .slice(i + 1)
      .findIndex((b) => b.type === "header" && level(b) === 2);
    const sectionBlocks = blocks.slice(i + 1, end < 0 ? blocks.length : i + 1 + end);
    i = end < 0 ? blocks.length : i + 1 + end;

    switch (sectionKey) {
      case "summary":
        out.summary = sectionBlocks
          .filter((b) => b.type === "paragraph")
          .map((b) => plain(b.data.text))
          .join("\n\n")
          .trim();
        break;
      case "experience":
        out.experience = parseExperience(sectionBlocks);
        break;
      case "education":
        out.education = parseEducation(sectionBlocks);
        break;
      case "projects":
        out.projects = parseProjects(sectionBlocks);
        break;
      case "skills":
        out.skills = parseSkills(sectionBlocks);
        break;
      case "certifications":
        out.certifications = listItems(sectionBlocks);
        break;
      case "awards":
        out.awards = listItems(sectionBlocks);
        break;
      default:
        // Unknown section — drop content silently.
        break;
    }
  }

  return out;
}

/* ---------- helpers ---------- */

function h(lvl: 1 | 2 | 3, text: string, meta?: Record<string, unknown>): EJBlock {
  return { type: "header", data: { text, level: lvl, ...(meta ? { meta } : {}) } };
}
function p(text: string, meta?: Record<string, unknown>): EJBlock {
  return { type: "paragraph", data: { text, ...(meta ? { meta } : {}) } };
}
function level(b: EJBlock): number {
  const lvl = (b.data as { level?: unknown }).level;
  return typeof lvl === "number" ? lvl : 2;
}
function plain(v: unknown): string {
  if (typeof v !== "string") return "";
  // Editor.js stores HTML in paragraph/header text. Strip tags + decode common entities.
  return v
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(b|strong|i|em|u|mark|code|a)[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function listStrings(b: EJBlock): string[] {
  const items = (b.data as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => {
      if (typeof it === "string") return plain(it);
      if (it && typeof it === "object" && "content" in it) {
        return plain((it as { content?: unknown }).content);
      }
      return "";
    })
    .filter(Boolean);
}

function listItems(blocks: EJBlock[]): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.type === "list") out.push(...listStrings(b));
    else if (b.type === "paragraph") {
      const t = plain(b.data.text);
      if (t) out.push(t);
    }
  }
  return out;
}

function matchSection(title: string): SectionKey | null {
  if (/summary|profile|about/.test(title)) return "summary";
  if (/experience|employment|work history|career/.test(title)) return "experience";
  if (/education|academic/.test(title)) return "education";
  if (/projects?|portfolio/.test(title)) return "projects";
  if (/skills?|competenc|expertise|technolog/.test(title)) return "skills";
  if (/certification|credential|license/.test(title)) return "certifications";
  if (/awards?|honors?|recognition/.test(title)) return "awards";
  return null;
}

function parseExperience(blocks: EJBlock[]): ExperienceItem[] {
  const out: ExperienceItem[] = [];
  let cur: ExperienceItem | null = null;
  const flush = () => {
    if (cur) out.push(cur);
    cur = null;
  };
  for (const b of blocks) {
    if (b.type === "header" && level(b) === 3) {
      flush();
      cur = {
        id: refIdOf(b) ?? `exp-${nanoid(6)}`,
        company: plain(b.data.text),
        role: "",
        bullets: [],
        startDate: "",
        endDate: "",
      };
    } else if (cur && b.type === "paragraph") {
      const text = plain(b.data.text);
      const meta = parseRoleMeta(text);
      if (!cur.role && meta.role) cur.role = meta.role;
      if (!cur.startDate && meta.startDate) cur.startDate = meta.startDate;
      if (!cur.endDate && meta.endDate) cur.endDate = meta.endDate;
      if (!cur.location && meta.location) cur.location = meta.location;
    } else if (cur && b.type === "list") {
      cur.bullets.push(...listStrings(b));
    }
  }
  flush();
  return out;
}

function parseEducation(blocks: EJBlock[]): EducationItem[] {
  const out: EducationItem[] = [];
  let cur: EducationItem | null = null;
  const flush = () => {
    if (cur) out.push(cur);
    cur = null;
  };
  for (const b of blocks) {
    if (b.type === "header" && level(b) === 3) {
      flush();
      cur = {
        id: refIdOf(b) ?? `edu-${nanoid(6)}`,
        school: plain(b.data.text),
        degree: "",
      };
    } else if (cur && b.type === "paragraph") {
      const text = plain(b.data.text);
      // First paragraph after H3 → degree/dates; second → details.
      if (!cur.degree) {
        const parts = text.split(/\s*·\s*/);
        cur.degree = parts[0] ?? text;
        for (const part of parts.slice(1)) {
          const dates = parseDateRange(part);
          if (dates) {
            cur.startDate = dates.start;
            cur.endDate = dates.end;
          } else if (!cur.field) {
            cur.field = part;
          }
        }
      } else if (!cur.details) {
        cur.details = text;
      } else {
        cur.details += "\n" + text;
      }
    }
  }
  flush();
  return out;
}

function parseProjects(blocks: EJBlock[]): ProjectItem[] {
  const out: ProjectItem[] = [];
  let cur: ProjectItem | null = null;
  const flush = () => {
    if (cur) out.push(cur);
    cur = null;
  };
  for (const b of blocks) {
    if (b.type === "header" && level(b) === 3) {
      flush();
      cur = { id: refIdOf(b) ?? `proj-${nanoid(6)}`, name: plain(b.data.text), bullets: [] };
    } else if (cur && b.type === "paragraph") {
      const text = plain(b.data.text);
      if (!cur.description) cur.description = text;
      else cur.description += "\n" + text;
    } else if (cur && b.type === "list") {
      cur.bullets.push(...listStrings(b));
    }
  }
  flush();
  return out;
}

function parseSkills(blocks: EJBlock[]): SkillGroup[] {
  const out: SkillGroup[] = [];
  for (const b of blocks) {
    if (b.type === "paragraph") {
      const text = plain(b.data.text);
      if (!text) continue;
      const m = text.match(/^([^:]{1,40}):\s*(.+)$/);
      if (m && m[1] && m[2]) {
        out.push({
          id: refIdOfData(b) ?? `skill-${nanoid(6)}`,
          label: m[1].trim(),
          items: m[2]
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean),
        });
      } else {
        out.push({
          id: `skill-${nanoid(6)}`,
          label: "Skills",
          items: text
            .split(/[,;]/)
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }
    } else if (b.type === "list") {
      const items = listStrings(b);
      if (items.length) {
        out.push({ id: `skill-${nanoid(6)}`, label: "Skills", items });
      }
    }
  }
  return out;
}

function refIdOf(b: EJBlock): string | undefined {
  return refIdOfData(b);
}
function refIdOfData(b: EJBlock): string | undefined {
  const meta = (b.data as { meta?: { refId?: unknown } }).meta;
  if (meta && typeof meta.refId === "string") return meta.refId;
  return undefined;
}

function parseRoleMeta(s: string): {
  role?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
} {
  const parts = s
    .split(/\s*·\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: { role?: string; startDate?: string; endDate?: string; location?: string } = {};
  for (const part of parts) {
    const dr = parseDateRange(part);
    if (dr) {
      out.startDate = dr.start;
      out.endDate = dr.end;
    } else if (!out.role) {
      out.role = part;
    } else if (!out.location) {
      out.location = part;
    }
  }
  return out;
}

function parseDateRange(s: string): { start: string; end: string } | null {
  const m = s.match(/^\s*(.+?)\s*[-–—]\s*(.+?)\s*$/);
  if (!m || !m[1] || !m[2]) return null;
  // Heuristic: at least one side mentions a 4-digit year or "Present".
  const hasYear = /\b\d{4}\b|present|current/i;
  if (!hasYear.test(m[1]) && !hasYear.test(m[2])) return null;
  return { start: m[1], end: m[2] };
}

function formatDateRange(start?: string, end?: string): string {
  const s = (start ?? "").trim();
  const e = (end ?? "").trim();
  if (!s && !e) return "";
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

function formatContactLine(c: ResumeContent): string {
  return [c.contact.email, c.contact.phone, c.contact.location, c.contact.linkedin, c.contact.website]
    .filter(Boolean)
    .join(" · ");
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/;
const URL_RE = /\bhttps?:\/\/\S+|\b(?:linkedin\.com|github\.com)\/\S+/i;
const LINKEDIN_RE = /linkedin\.com\/\S+/i;

function looksLikeContact(text: string): boolean {
  return EMAIL_RE.test(text) || PHONE_RE.test(text) || URL_RE.test(text);
}

function mergeContactFromText(out: ResumeContent, text: string) {
  const email = text.match(EMAIL_RE)?.[0];
  const phone = text.match(PHONE_RE)?.[0];
  const linkedin = text.match(LINKEDIN_RE)?.[0];
  const url = text.match(URL_RE)?.[0];
  if (email) out.contact.email = email;
  if (phone) out.contact.phone = phone;
  if (linkedin) out.contact.linkedin = linkedin;
  else if (url) out.contact.website = url;

  // Whatever is left after stripping the above looks like the location.
  let leftover = text;
  for (const re of [EMAIL_RE, PHONE_RE, URL_RE, LINKEDIN_RE]) {
    leftover = leftover.replace(re, "");
  }
  leftover = leftover
    .split(/[·|,]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 60)
    .find((s) => /[A-Za-z]/.test(s)) ?? "";
  if (leftover && !out.contact.location) out.contact.location = leftover;
}
