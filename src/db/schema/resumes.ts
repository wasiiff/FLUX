import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import type { ResumeContent } from "@/lib/resume/types";

export const resumeStatus = pgEnum("resume_status", ["draft", "optimizing", "optimized", "archived"]);

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    targetRole: text("target_role"),
    status: resumeStatus("status").notNull().default("draft"),
    /** Editor.js OutputData (or our normalized Resume schema). */
    content: jsonb("content").$type<ResumeContent>().notNull(),
    currentVersionId: uuid("current_version_id"),
    /** Latest ATS score snapshot. */
    score: integer("score"),
    coverImage: text("cover_image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("resumes_user_idx").on(t.userId),
    statusIdx: index("resumes_status_idx").on(t.status),
  }),
);

export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    label: text("label"),
    content: jsonb("content").$type<ResumeContent>().notNull(),
    diffSummary: text("diff_summary"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    resumeIdx: index("resume_versions_resume_idx").on(t.resumeId),
    uniqueVersion: uniqueIndex("resume_versions_unique").on(t.resumeId, t.versionNumber),
  }),
);

export const resumeExports = pgTable(
  "resume_exports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    versionId: uuid("version_id").references(() => resumeVersions.id, { onDelete: "set null" }),
    format: text("format", { enum: ["pdf", "docx"] }).notNull(),
    template: text("template").notNull().default("corporate-modern"),
    cloudinaryUrl: text("cloudinary_url"),
    sizeBytes: integer("size_bytes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    resumeIdx: index("resume_exports_resume_idx").on(t.resumeId),
  }),
);

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type ResumeVersion = typeof resumeVersions.$inferSelect;
export type ResumeExport = typeof resumeExports.$inferSelect;
