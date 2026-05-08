import "server-only";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import type { ResumeContent } from "./types";
import type { TemplateId } from "./templates";
import { Readable } from "node:stream";

/**
 * FAANGPath-style template — clean, single-column, ATS-friendly.
 * Inspired by https://www.overleaf.com/latex/templates/faangpath-simple-template/npsfpdqnxmbc
 *
 * No remote font fetching — uses the built-in Helvetica + Helvetica-Oblique
 * shipped with @react-pdf/renderer.
 */

const INK = "#111111";
const MUTED = "#444444";
const RULE = "#888888";

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 28, // 0.4 in
    paddingVertical: 28,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: INK,
    lineHeight: 1.35,
  },

  // Header
  header: { alignItems: "center", marginBottom: 8 },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    lineHeight: 1.1,
    marginBottom: 4,
  },
  headline: {
    fontSize: 10,
    color: MUTED,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
    marginBottom: 3,
  },
  contactLine: {
    fontSize: 9.5,
    color: MUTED,
    textAlign: "center",
  },

  // Sections
  sectionWrap: { marginTop: 12 },
  sectionHeader: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingBottom: 1,
  },
  sectionRule: {
    borderBottomWidth: 0.75,
    borderBottomColor: RULE,
    marginBottom: 6,
  },

  // Generic body text
  body: { fontSize: 10.5, color: INK },
  muted: { color: MUTED },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },

  // Two-line entry rows (role/company)
  entryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  entryRoleLeft: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  entryDateRight: { fontSize: 10, color: MUTED },
  entrySubLeft: { fontFamily: "Helvetica-Oblique", fontSize: 10.5, color: INK },
  entrySubRight: { fontFamily: "Helvetica-Oblique", fontSize: 10, color: MUTED },

  entryBlock: { marginBottom: 6 },

  // Bullets
  bulletList: { marginTop: 2, paddingLeft: 12 },
  bullet: { flexDirection: "row", marginBottom: 1.5 },
  bulletDot: { width: 10, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 10.5, lineHeight: 1.35 },

  // Skills tabular row
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillLabel: {
    width: 110,
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
  },
  skillItems: { flex: 1, fontSize: 10.5 },

  // Inline list (certifications, awards)
  inlineItem: { fontSize: 10.5, marginBottom: 1.5 },
});

interface RenderOpts {
  template: TemplateId;
  accent: string;
}

function joinSep(parts: Array<string | undefined | null>, sep = " · "): string {
  return parts.filter((p): p is string => Boolean(p && String(p).trim())).join(sep);
}

function dateRange(start?: string, end?: string): string {
  const s = (start ?? "").trim();
  const e = (end ?? "").trim();
  if (!s && !e) return "";
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionWrap} wrap={false}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.sectionRule} />
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.bulletList}>
      {items.map((b, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function ResumeDoc({ resume, opts }: { resume: ResumeContent; opts: RenderOpts }) {
  const accent = opts.accent || INK;
  const contactLine = joinSep([
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
    resume.contact.website,
  ]);

  return (
    <Document title={resume.fullName} author={resume.fullName}>
      <Page size="LETTER" style={styles.page}>
        {/* ── Header ─────────────────────────── */}
        <View style={styles.header}>
          <Text style={[styles.name, { color: accent }]}>{resume.fullName}</Text>
          {resume.headline ? <Text style={styles.headline}>{resume.headline}</Text> : null}
          {contactLine ? <Text style={styles.contactLine}>{contactLine}</Text> : null}
        </View>

        {/* ── Summary ────────────────────────── */}
        {resume.summary ? (
          <Section title="Summary">
            <Text style={styles.body}>{resume.summary}</Text>
          </Section>
        ) : null}

        {/* ── Experience ─────────────────────── */}
        {resume.experience.length > 0 ? (
          <Section title="Experience">
            {resume.experience.map((e) => (
              <View key={e.id} style={styles.entryBlock} wrap={false}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryRoleLeft}>{e.role || e.company}</Text>
                  <Text style={styles.entryDateRight}>{dateRange(e.startDate, e.endDate)}</Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entrySubLeft}>{e.company}</Text>
                  {e.location ? <Text style={styles.entrySubRight}>{e.location}</Text> : null}
                </View>
                <Bullets items={e.bullets} />
              </View>
            ))}
          </Section>
        ) : null}

        {/* ── Projects ───────────────────────── */}
        {resume.projects.length > 0 ? (
          <Section title="Projects">
            {resume.projects.map((p) => (
              <View key={p.id} style={styles.entryBlock} wrap={false}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryRoleLeft}>{p.name}</Text>
                  {p.url ? <Text style={styles.entryDateRight}>{p.url}</Text> : null}
                </View>
                {p.description ? (
                  <Text style={[styles.body, { marginTop: 1 }]}>{p.description}</Text>
                ) : null}
                <Bullets items={p.bullets} />
              </View>
            ))}
          </Section>
        ) : null}

        {/* ── Education ──────────────────────── */}
        {resume.education.length > 0 ? (
          <Section title="Education">
            {resume.education.map((ed) => (
              <View key={ed.id} style={styles.entryBlock} wrap={false}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryRoleLeft}>{ed.school}</Text>
                  <Text style={styles.entryDateRight}>{dateRange(ed.startDate, ed.endDate)}</Text>
                </View>
                <View style={styles.entryRow}>
                  <Text style={styles.entrySubLeft}>
                    {joinSep([ed.degree, ed.field], " · ")}
                  </Text>
                </View>
                {ed.details ? (
                  <Text style={[styles.body, styles.muted, { marginTop: 1 }]}>{ed.details}</Text>
                ) : null}
              </View>
            ))}
          </Section>
        ) : null}

        {/* ── Skills (tabular) ───────────────── */}
        {resume.skills.length > 0 ? (
          <Section title="Skills">
            {resume.skills.map((g) => (
              <View key={g.id} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{g.label}</Text>
                <Text style={styles.skillItems}>{g.items.join(", ")}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {/* ── Certifications ─────────────────── */}
        {resume.certifications.length > 0 ? (
          <Section title="Certifications">
            {resume.certifications.map((c, i) => (
              <Text key={i} style={styles.inlineItem}>
                • {c}
              </Text>
            ))}
          </Section>
        ) : null}

        {/* ── Awards ─────────────────────────── */}
        {resume.awards.length > 0 ? (
          <Section title="Awards">
            {resume.awards.map((a, i) => (
              <Text key={i} style={styles.inlineItem}>
                • {a}
              </Text>
            ))}
          </Section>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderResumePdf(resume: ResumeContent, opts: RenderOpts): Promise<Buffer> {
  const stream = await renderToStream(<ResumeDoc resume={resume} opts={opts} />);
  return streamToBuffer(stream as unknown as Readable);
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c) => chunks.push(Buffer.from(c)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
