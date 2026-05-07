import { requireUser } from "@/lib/auth/session";
import { listResumes } from "@/features/resumes/queries";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MaterialSymbol } from "@/components/ui/icon";
import Link from "next/link";

export const metadata = { title: "Archive" };

export default async function ArchivePage() {
  const user = await requireUser();
  const all = await listResumes(user.id, { archived: true });

  return (
    <main className="flex-1 p-margin max-w-[var(--spacing-container-max)] mx-auto w-full">
      <header className="mb-section-gap">
        <h1 className="font-h1 text-h1 text-on-surface mb-2">Archive</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Every version, every variant — preserved.
        </p>
      </header>

      <section className="border border-outline-variant bg-surface-container-lowest p-8">
        {all.length === 0 ? (
          <p className="font-body-md text-on-surface-variant">No documents archived yet.</p>
        ) : (
          <div>
            {all.map((r) => (
              <Link
                key={r.id}
                href={`/editor/${r.id}`}
                className="grid grid-cols-12 gap-4 py-4 border-b border-outline-variant items-center hover:bg-surface-container-low transition-colors group"
              >
                <div className="col-span-7 font-body-lg text-body-lg text-on-surface group-hover:text-primary flex items-center gap-3">
                  <MaterialSymbol name="archive" opticalSize={20} />
                  {r.title}
                </div>
                <div className="col-span-3 font-data-tabular text-data-tabular text-on-surface-variant">
                  {formatDate(r.updatedAt)}
                </div>
                <div className="col-span-2 flex justify-end">
                  <Badge variant="outline">{r.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
