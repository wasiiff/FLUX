import "server-only";
import { PDFParse } from "pdf-parse";

export interface ParsedPdf {
  text: string;
  pages: number;
}

/**
 * Extract plain text from a PDF buffer. Pages are joined with double newlines
 * so the downstream LLM can still see paragraph breaks.
 */
export async function parsePdf(buffer: Buffer | Uint8Array): Promise<ParsedPdf> {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return {
      text: (result.text ?? "").trim(),
      pages: result.pages?.length ?? 0,
    };
  } finally {
    await parser.destroy?.().catch(() => {});
  }
}
