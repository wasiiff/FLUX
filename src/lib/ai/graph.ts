import "server-only";
import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { env } from "@/lib/env";
import { SYSTEM } from "./prompts";
import { JdExtractionSchema, type JdExtraction, AtsScoreSchema, type AtsScore } from "./schemas";
import { ResumeContentSchema, type ResumeContent } from "@/lib/resume/types";
import { scoreResume } from "@/lib/ats/scorer";

/**
 * LangGraph: extract → analyze (JD) → rewrite (resume) → score
 * State carries raw inputs, intermediate parses, and the final artifact.
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
  error: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
});

const llm = new ChatAnthropic({
  apiKey: env.ANTHROPIC_API_KEY ?? "",
  model: env.AI_MODEL_PRIMARY,
  temperature: 0.2,
});

async function analyzeJD(state: typeof State.State) {
  if (!state.jobDescription?.trim()) {
    return { jdExtraction: { hardSkills: [], softSkills: [], responsibilities: [] } };
  }
  const res = await llm.invoke([
    new SystemMessage(SYSTEM.jdAnalyzer),
    new HumanMessage(
      `Analyze this job description and return JSON only.\n\n<job>\n${state.jobDescription}\n</job>`,
    ),
  ]);
  const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  const json = extractJson(text);
  const parsed = JdExtractionSchema.safeParse(json);
  return parsed.success ? { jdExtraction: parsed.data } : { error: "JD analysis failed" };
}

async function rewriteResume(state: typeof State.State) {
  if (!state.jdExtraction) return { rewrittenResume: state.resume };
  const targetKeywords = [
    ...state.jdExtraction.hardSkills,
    ...state.jdExtraction.softSkills,
  ];
  const res = await llm.invoke([
    new SystemMessage(SYSTEM.resumeArchitect),
    new HumanMessage(
      [
        "Rewrite this resume to align with the target keywords while preserving truthfulness.",
        `Target keywords: ${targetKeywords.join(", ")}`,
        "Return strict JSON conforming to the resume schema. No prose.",
        `<resume>${JSON.stringify(state.resume)}</resume>`,
      ].join("\n\n"),
    ),
  ]);
  const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  const json = extractJson(text);
  const parsed = ResumeContentSchema.safeParse(json);
  return parsed.success ? { rewrittenResume: parsed.data } : { rewrittenResume: state.resume };
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
  // Strip markdown code fences.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1] ?? trimmed;
  try {
    return JSON.parse(body);
  } catch {
    // Try to slice the first { ... } block.
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch {}
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

export type OptimizationOutput = {
  jdExtraction: JdExtraction | null;
  rewrittenResume: ResumeContent | null;
  score: AtsScore | null;
};

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
  };
}
