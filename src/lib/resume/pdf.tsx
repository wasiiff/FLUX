import "server-only";
import { Document, Page, Text, View, StyleSheet, Font, renderToStream } from "@react-pdf/renderer";
import type { ResumeContent } from "./types";
import type { TemplateId } from "./templates";
import { Readable } from "node:stream";

// Optional: load Inter & Newsreader from Google Fonts CDN.
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.ttf" },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7SUc.ttf", fontWeight: 600 },
  ],
});

const styles = StyleSheet.create({
  page: { paddingHorizontal: 56, paddingVertical: 56, fontFamily: "Inter", fontSize: 10.5, color: "#0b1c30" },
  name: { fontSize: 26, fontWeight: 600, color: "#000" },
  headline: { fontSize: 12, color: "#45464d", marginTop: 4 },
  contact: { fontSize: 9.5, color: "#45464d", marginTop: 6, letterSpacing: 0.4 },
  hr: { borderBottomWidth: 1, borderBottomColor: "#c6c6cd", marginVertical: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#0b1c30",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  roleHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  company: { fontSize: 11.5, fontWeight: 600 },
  role: { fontSize: 10.5, color: "#45464d", marginBottom: 4 },
  date: { fontSize: 9.5, color: "#45464d" },
  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 8, fontSize: 10 },
  bulletText: { flex: 1, lineHeight: 1.45 },
  twoCol: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
});

interface RenderOpts {
  template: TemplateId;
  accent: string;
}

function ResumeDoc({ resume, opts }: { resume: ResumeContent; opts: RenderOpts }) {
  const accent = opts.accent;
  const contactLine = [
    resume.contact.email,
    resume.contact.phone,
    resume.contact.location,
    resume.contact.linkedin,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <Document title={resume.fullName} author={resume.fullName}>
      <Page size="LETTER" style={styles.page}>
        <View>
          <Text style={[styles.name, { color: accent }]}>{resume.fullName}</Text>
          {resume.headline ? <Text style={styles.headline}>{resume.headline}</Text> : null}
          {contactLine ? <Text style={styles.contact}>{contactLine}</Text> : null}
        </View>
        <View style={styles.hr} />

        {resume.summary ? (
          <View>
            <Text style={[styles.sectionTitle, { color: accent }]}>Executive Summary</Text>
            <Text style={{ lineHeight: 1.5 }}>{resume.summary}</Text>
            <View style={styles.hr} />
          </View>
        ) : null}

        {resume.experience.length > 0 ? (
          <View>
            <Text style={[styles.sectionTitle, { color: accent }]}>Professional Experience</Text>
            {resume.experience.map((e) => (
              <View key={e.id} style={{ marginBottom: 10 }}>
                <View style={styles.roleHeader}>
                  <Text style={styles.company}>{e.company}</Text>
                  <Text style={styles.date}>
                    {e.startDate ?? ""} – {e.endDate ?? "Present"}
                  </Text>
                </View>
                <Text style={styles.role}>{e.role}</Text>
                {e.bullets.map((b, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
            <View style={styles.hr} />
          </View>
        ) : null}

        <View style={styles.twoCol}>
          {resume.education.length > 0 ? (
            <View style={styles.col}>
              <Text style={[styles.sectionTitle, { color: accent }]}>Education</Text>
              {resume.education.map((e) => (
                <View key={e.id} style={{ marginBottom: 6 }}>
                  <Text style={{ fontWeight: 600 }}>{e.school}</Text>
                  <Text style={{ color: "#45464d" }}>{e.degree}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {resume.skills.length > 0 ? (
            <View style={styles.col}>
              <Text style={[styles.sectionTitle, { color: accent }]}>Core Competencies</Text>
              {resume.skills.flatMap((g) => g.items).map((s, i) => (
                <Text key={i}>• {s}</Text>
              ))}
            </View>
          ) : null}
        </View>
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
