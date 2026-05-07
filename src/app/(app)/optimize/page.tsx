import { requireUser } from "@/lib/auth/session";
import { listResumes } from "@/features/resumes/queries";
import { OptimizeWorkspace } from "@/features/optimize/optimize-workspace";

export const metadata = { title: "Strategic Optimization Workspace" };

export default async function OptimizePage() {
  const user = await requireUser();
  const resumes = await listResumes(user.id);
  return <OptimizeWorkspace resumes={resumes} />;
}
