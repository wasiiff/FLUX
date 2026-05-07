import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { resumes } from "./resumes";

export const aiRunStatus = pgEnum("ai_run_status", ["pending", "running", "completed", "failed"]);
export const aiRunKind = pgEnum("ai_run_kind", [
  "extract",
  "analyze",
  "rewrite",
  "score",
  "tailor",
  "summarize",
]);

export const aiRuns = pgTable(
  "ai_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resumeId: uuid("resume_id").references(() => resumes.id, { onDelete: "cascade" }),
    kind: aiRunKind("kind").notNull(),
    status: aiRunStatus("status").notNull().default("pending"),
    model: text("model").notNull(),
    /** Compact LangGraph state snapshot (per node). */
    graphState: jsonb("graph_state").$type<Record<string, unknown>>(),
    inputTokens: integer("input_tokens").default(0),
    outputTokens: integer("output_tokens").default(0),
    latencyMs: integer("latency_ms"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("ai_runs_user_idx").on(t.userId),
    resumeIdx: index("ai_runs_resume_idx").on(t.resumeId),
    statusIdx: index("ai_runs_status_idx").on(t.status),
  }),
);

export type AiRun = typeof aiRuns.$inferSelect;
