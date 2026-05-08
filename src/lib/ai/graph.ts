import "server-only";
import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { generateText } from "ai";
import { models } from "./provider";
import { SYSTEM } from "./prompts";
import { JdExtractionSchema, type JdExtraction, AtsScoreSchema, type AtsScore } from "./schemas";
import { ResumeContentSchema, type ResumeContent } from "@/lib/resume/types";
import { scoreResume } from "@/lib/ats/scorer";

/**
 * LangGraph orchestration:  analyze → rewrite → score
 *
 * Each node calls Vercel AI Gateway via the AI SDK (string model IDs route
 * through https://ai-gateway.vercel.sh when AI_GATEWAY_API_KEY is set).
 * No direct provider SDKs are imported — switching models is a config change.
 */

const State = Annotation.Root({
  resume: Annotation<ResumeContent>(),
  jobDescription: Annotation<string>(),
  jdExtraction: Annotation<JdExtraction | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  rewrittenResume: Annotation<ResumeContent | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  score: Annotation<AtsScore | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  tokensIn: Annotation<number>({ reducer: (a, b) => a + b, default: () => 0 }),
  tokensOut: Annotation<number>({ reducer: (a, b) => a + b, default: () => 0 }),
  error: Annotation<string | null>({ reducer: (_, next) => next, default: () => null }),
});

async function analyzeJD(state: typeof State.State) {
  if (!state.jobDescription?.trim()) {
    return { jdExtraction: { hardSkills: [], softSkills: [], responsibilities: [] } };
  }
  const { text, usage } = await generateText({
    model: models.primary,
    system: SYSTEM.jdAnalyzer,
    prompt: `Analyze this job description and return JSON only.\n\n<job>\n${state.jobDescription}\n</job>`,
    temperature: 0.1,
  });
  const parsed = JdExtractionSchema.safeParse(extractJson(text));
  return {
    jdExtraction: parsed.success ? parsed.data : null,
    tokensIn: usage?.inputTokens ?? 0,
    tokensOut: usage?.outputTokens ?? 0,
    ...(parsed.success ? {} : { error: "JD analysis failed" }),
  };
}

async function rewriteResume(state: typeof State.State) {
  if (!state.jdExtraction) return { rewrittenResume: state.resume };
  const targetKeywords = [
    ...state.jdExtraction.hardSkills,
    ...state.jdExtraction.softSkills,
  ];
  const { text, usage } = await generateText({
    model: models.primary,
    system: SYSTEM.resumeArchitect,
    prompt: [
      "Rewrite this resume to align with the target keywords while preserving truthfulness.",
      `Target keywords: ${targetKeywords.join(", ")}`,
      "Return strict JSON conforming to the resume schema. No prose, no markdown.",
      `<resume>${JSON.stringify(state.resume)}</resume>`,
    ].join("\n\n"),
    temperature: 0.3,
  });
  const parsed = ResumeContentSchema.safeParse(extractJson(text));
  return {
    rewrittenResume: parsed.success ? parsed.data : state.resume,
    tokensIn: usage?.inputTokens ?? 0,
    tokensOut: usage?.outputTokens ?? 0,
  };
}

function deterministicScore(state: typeof State.State) {
  const target = state.rewrittenResume ?? state.resume;
  const keywords = state.jdExtraction
    ? [...state.jdExtraction.hardSkills, ...state.jdExtraction.softSkills]
    : [];
  const score = scoreResume({ resume: target, keywords });
  const parsed = AtsScoreSchema.safeParse(score);
  return parsed.success ? { score: parsed.data } : { error: "Scoring failed" };
}

function extractJson(s: string): unknown {
  const trimmed = s.trim();
  // Strip markdown code fences if the model adds them despite instructions.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1] ?? trimmed;
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    return {};
  }
}

export function buildOptimizationGraph() {
  return new StateGraph(State)
    .addNode("analyze", analyzeJD)
    .addNode("rewrite", rewriteResume)
    .addNode("score", deterministicScore)
    .addEdge(START, "analyze")
    .addEdge("analyze", "rewrite")
    .addEdge("rewrite", "score")
    .addEdge("score", END)
    .compile();
}

export interface OptimizationOutput {
  jdExtraction: JdExtraction | null;
  rewrittenResume: ResumeContent | null;
  score: AtsScore | null;
  tokensIn: number;
  tokensOut: number;
}

export async function runOptimization(input: {
  resume: ResumeContent;
  jobDescription: string;
}): Promise<OptimizationOutput> {
  const graph = buildOptimizationGraph();
  const result = await graph.invoke(input);
  return {
    jdExtraction: result.jdExtraction ?? null,
    rewrittenResume: result.rewrittenResume ?? null,
    score: result.score ?? null,
    tokensIn: result.tokensIn ?? 0,
    tokensOut: result.tokensOut ?? 0,
  };
}
