import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { dashboardStats } from "@/features/resumes/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/icon";
import { ScoreRing } from "@/features/dashboard/score-ring";
import { CreateResumeDialog } from "@/features/dashboard/create-resume-dialog";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Executive Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await dashboardStats(user.id);

  const firstName = (user.name ?? user.email.split("@")[0] ?? "there").split(" ")[0];

  return (
    <main className="flex-1 overflow-y-auto bg-surface-bright p-gutter lg:p-margin">
      <div className="max-w-[var(--spacing-container-max)] mx-auto">
        <header className="mb-section-gap flex items-end justify-between gap-gutter">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface mb-2">Good morning, {firstName}.</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Here is your strategic overview for today.
            </p>
          </div>
          <CreateResumeDialog>
            <Button size="lg">
              <MaterialSymbol name="add" opticalSize={20} />
              New Document
            </Button>
          </CreateResumeDialog>
        </header>

        {/* Metric grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-section-gap">
          <div className="border border-outline-variant bg-surface-container-lowest p-8 flex flex-col items-center justify-center text-center hover:bg-surface-container-low transition-colors">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-6">
              Career Performance
            </h3>
            <ScoreRing value={stats.careerScore} />
            <p className="font-label-caps text-label-caps text-on-surface-variant mt-4">
              {stats.careerScore >= 90
                ? "Top 5% of Executives"
                : stats.careerScore >= 70
                  ? "Strong Trajectory"
                  : "Optimization Recommended"}
            </p>
          </div>

          <div className="border border-outline-variant bg-surface-container-lowest p-8 flex flex-col justify-between hover:bg-surface-container-low transition-colors">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                Active Resumes
              </h3>
              <MaterialSymbol name="description" opticalSize={20} />
            </div>
            <div>
              <div className="font-h1 text-h1 text-on-surface mb-2">{stats.total}</div>
              <p className="font-label-caps text-label-caps text-on-surface-variant border-t border-outline-variant pt-4 mt-4">
                {stats.optimizing} in optimization
              </p>
            </div>
          </div>

          <div className="border border-outline-variant bg-surface-container-lowest p-8 flex flex-col justify-between hover:bg-surface-container-low transition-colors">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                Job Match Rate
              </h3>
              <MaterialSymbol name="analytics" opticalSize={20} />
            </div>
            <div>
              <div className="font-h1 text-h1 text-on-surface mb-2">{stats.matchRate}%</div>
              <p className="font-label-caps text-label-caps text-on-surface-variant border-t border-outline-variant pt-4 mt-4">
                Across targeted roles
              </p>
            </div>
          </div>
        </section>

        {/* Lower section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-section-gap">
          <section className="lg:col-span-8 border border-outline-variant bg-surface-container-lowest p-8">
            <div className="flex justify-between items-end border-b border-outline-variant pb-4 mb-6">
              <h2 className="font-h3 text-h3 text-on-surface">Recent Documents</h2>
              <Button asChild variant="link">
                <Link href="/portfolio">
                  View All <MaterialSymbol name="arrow_forward" opticalSize={16} />
                </Link>
              </Button>
            </div>

            {stats.recent.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="w-full">
                <div className="grid grid-cols-12 gap-4 pb-2 border-b border-outline-variant font-label-caps text-label-caps text-on-surface-variant">
                  <div className="col-span-6">DOCUMENT TITLE</div>
                  <div className="col-span-3">LAST MODIFIED</div>
                  <div className="col-span-3 text-right">STATUS</div>
                </div>
                {stats.recent.map((r) => (
                  <Link
                    key={r.id}
                    href={`/editor/${r.id}`}
                    className="grid grid-cols-12 gap-4 py-4 border-b border-outline-variant items-center hover:bg-surface-container-low transition-colors group"
                  >
                    <div className="col-span-6 font-body-lg text-body-lg text-on-surface group-hover:text-primary transition-colors flex items-center gap-3">
                      <MaterialSymbol name="article" opticalSize={20} />
                      {r.title}
                    </div>
                    <div className="col-span-3 font-data-tabular text-data-tabular text-on-surface-variant">
                      {formatDate(r.updatedAt)}
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <StatusBadge status={r.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:col-span-4 border border-outline-variant bg-surface-container-low p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <MaterialSymbol name="lightbulb" opticalSize={20} className="text-primary" />
              <h2 className="font-label-caps text-label-caps text-primary">
                MARKET INTELLIGENCE
              </h2>
            </div>
            <h3 className="font-h3 text-h3 text-on-surface mb-4">
              Executive Networking: The Shift to Niche Communities
            </h3>
            <div className="font-body-md text-body-md text-on-surface-variant space-y-4 mb-8 flex-1">
              <p>
                Recent data indicates a 40% decrease in C-suite hires sourced from broad
                professional networks. The focus has decisively shifted towards private,
                specialized communities and retained search firms.
              </p>
              <p>
                <strong>Strategic Action:</strong> Ensure your portfolio highlights specialized
                industry contributions rather than generalist leadership traits to align with
                targeted search criteria.
              </p>
            </div>
            <Button variant="outline" size="lg">Read Full Report</Button>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "optimized":
      return <Badge>Optimized</Badge>;
    case "optimizing":
      return <Badge variant="ai">Optimizing</Badge>;
    case "draft":
      return <Badge variant="outline">Draft</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function EmptyState() {
  return (
    <div className="py-16 text-center border border-dashed border-outline-variant">
      <MaterialSymbol
        name="description"
        opticalSize={48}
        className="text-on-surface-variant mb-4"
      />
      <h3 className="font-h3 text-h3 text-on-surface mb-2">No documents yet</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-6">
        Create your first executive resume to begin optimization.
      </p>
      <CreateResumeDialog>
        <Button>
          <MaterialSymbol name="add" opticalSize={20} />
          Create Resume
        </Button>
      </CreateResumeDialog>
    </div>
  );
}
