import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { resumes } from "./resumes";

export const jobDescriptions = pgTable(
  "job_descriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    company: text("company"),
    description: text("description").notNull(),
    sourceUrl: text("source_url"),
    /** Extracted keywords/competencies (post-LLM analysis). */
    extracted: jsonb("extracted")
      .$type<{
        hardSkills: string[];
        softSkills: string[];
        responsibilities: string[];
        seniority?: string;
        domain?: string;
      }>()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("jobs_user_idx").on(t.userId),
  }),
);

export const atsScores = pgTable(
  "ats_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    jobId: uuid("job_id").references(() => jobDescriptions.id, { onDelete: "set null" }),
    overall: integer("overall").notNull(),
    keywordMatch: integer("keyword_match").notNull(),
    formatting: integer("formatting").notNull(),
    quantification: integer("quantification").notNull(),
    readability: integer("readability").notNull(),
    breakdown: jsonb("breakdown")
      .$type<{
        matched: string[];
        missing: string[];
        suggestions: string[];
      }>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    resumeIdx: index("ats_scores_resume_idx").on(t.resumeId),
  }),
);

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type AtsScore = typeof atsScores.$inferSelect;
