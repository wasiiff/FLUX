import "dotenv/config";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePdf } from "../src/lib/resume/parse-pdf";
import { ingestResumeFromText } from "../src/lib/ai/ingest";
import { renderResumePdf } from "../src/lib/resume/pdf";

const FILE = process.argv[2] ?? "Wasif.pdf";
const OUT = process.argv[3] ?? "out-test.pdf";

async function main() {
  const buf = readFileSync(resolve(FILE));
  const parsed = await parsePdf(buf);
  const ingested = await ingestResumeFromText(parsed.text, "Wasif");
  console.log(`Rendering PDF for: ${ingested.resume.fullName}`);
  const pdf = await renderResumePdf(ingested.resume, {
    template: "corporate-modern" as never,
    accent: "#000000",
  });
  writeFileSync(OUT, pdf);
  console.log(`✓ Wrote ${OUT}  (${(pdf.byteLength / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error("✗ FAILED:", e);
  process.exit(1);
});
