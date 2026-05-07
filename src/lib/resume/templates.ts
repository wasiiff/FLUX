export const TEMPLATES = [
  {
    id: "corporate-modern" as const,
    name: "Corporate Modern",
    description: "Two-column executive layout with serif headings.",
  },
  {
    id: "executive-minimal" as const,
    name: "Executive Minimal",
    description: "Single-column, generous whitespace, ideal for senior IC.",
  },
  {
    id: "boardroom-classic" as const,
    name: "Boardroom Classic",
    description: "Traditional centered header with navy accents.",
  },
];

export type TemplateId = (typeof TEMPLATES)[number]["id"];
