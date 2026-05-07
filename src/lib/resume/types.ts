import { z } from "zod";

/**
 * Canonical, template-agnostic resume schema.
 * Editor.js blocks are projected into / out of this shape.
 */

export const ContactSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
});

export const ExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(), // YYYY-MM
  endDate: z.string().optional(),   // YYYY-MM | "Present"
  bullets: z.array(z.string()).default([]),
});

export const EducationItemSchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  details: z.string().optional(),
});

export const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  description: z.string().optional(),
  bullets: z.array(z.string()).default([]),
});

export const SkillGroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  items: z.array(z.string()).default([]),
});

export const ResumeContentSchema = z.object({
  fullName: z.string(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  contact: ContactSchema.default({}),
  experience: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  skills: z.array(SkillGroupSchema).default([]),
  certifications: z.array(z.string()).default([]),
  awards: z.array(z.string()).default([]),
});

export type Contact = z.infer<typeof ContactSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type EducationItem = z.infer<typeof EducationItemSchema>;
export type ProjectItem = z.infer<typeof ProjectItemSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type ResumeContent = z.infer<typeof ResumeContentSchema>;

export const emptyResume = (fullName = "Untitled"): ResumeContent => ({
  fullName,
  headline: "",
  summary: "",
  contact: {},
  experience: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
  awards: [],
});
