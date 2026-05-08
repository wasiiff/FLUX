import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePdf } from "../src/lib/resume/parse-pdf";
import { ingestResumeFromText } from "../src/lib/ai/ingest";
import { runOptimization } from "../src/lib/ai/graph";

const FILE = process.argv[2] ?? "Wasif.pdf";
const JD = `We are hiring a Senior Full-Stack Engineer to architect and ship our next-gen
AI-powered platform. You will own services in TypeScript, Next.js, and Node.js,
collaborate with ML engineers on RAG and agent pipelines, and lead infrastructure
work across Postgres, Redis, and Vercel/AWS. Strong product sense, experience
mentoring engineers, and a track record of measurable impact required.`;

async function main() {
  const buf = readFileSync(resolve(FILE));
  console.log(`[1/3] Parsing PDF (${(buf.length / 1024).toFixed(0)} KB)…`);
  const parsed = await parsePdf(buf);
  console.log(`      pages=${parsed.pages}  text=${parsed.text.length} chars`);
  console.log(`      preview: ${parsed.text.slice(0, 200).replace(/\s+/g, " ")}…`);

  console.log(`\n[2/3] Ingesting into ResumeContent…`);
  const ingested = await ingestResumeFromText(parsed.text, "Wasif");
  console.log(
    `      fullName=${ingested.resume.fullName}  experience=${ingested.resume.experience.length}  edu=${ingested.resume.education.length}  skills=${ingested.resume.skills.length}`,
  );
  console.log(`      tokensIn=${ingested.tokensIn} tokensOut=${ingested.tokensOut}`);

  console.log(`\n[3/3] Running optimization graph (analyze → rewrite → scoring)…`);
  const out = await runOptimization({ resume: ingested.resume, jobDescription: JD });
  console.log(
    `      score.overall=${out.score?.overall}  matched=${out.score?.matched.length}  missing=${out.score?.missing.length}`,
  );
  console.log(`      tokensIn=${out.tokensIn} tokensOut=${out.tokensOut}`);
  console.log(`\n✓ End-to-end pipeline succeeded.`);
}

main().catch((err) => {
  console.error("\n✗ FAILED:", err);
  process.exit(1);
});
