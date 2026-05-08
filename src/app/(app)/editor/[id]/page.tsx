import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getResume, latestScore } from "@/features/resumes/queries";
import { EditorJsResume } from "@/features/editor/editorjs-resume";
import { StrategicAnalysisPanel } from "@/features/editor/strategic-analysis-panel";

export const metadata = { title: "Strategic Resume Editor" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const resume = await getResume(user.id, id);
  if (!resume) notFound();

  const score = await latestScore(resume.id);

  return (
    <main className="flex-1 flex overflow-hidden">
      <section className="flex-1 overflow-y-auto p-margin bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto bg-surface-container-lowest border border-outline-variant p-[80px] min-h-[1056px]">
          <EditorJsResume resume={resume} />
        </div>
      </section>
      <aside className="w-96 bg-surface border-l border-outline-variant flex flex-col h-full shrink-0">
        <StrategicAnalysisPanel resume={resume} score={score} />
      </aside>
    </main>
  );
}
