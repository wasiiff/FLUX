import { z } from "zod";

export const JdExtractionSchema = z.object({
  hardSkills: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  seniority: z.string().optional(),
  domain: z.string().optional(),
});
export type JdExtraction = z.infer<typeof JdExtractionSchema>;

export const AtsScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  keywordMatch: z.number().min(0).max(100),
  formatting: z.number().min(0).max(100),
  quantification: z.number().min(0).max(100),
  readability: z.number().min(0).max(100),
  matched: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});
export type AtsScore = z.infer<typeof AtsScoreSchema>;

export const RewriteSuggestionSchema = z.object({
  section: z.string(),
  before: z.string(),
  after: z.string(),
  rationale: z.string(),
});
export type RewriteSuggestion = z.infer<typeof RewriteSuggestionSchema>;
