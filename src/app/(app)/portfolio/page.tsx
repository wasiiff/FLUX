import { requireUser } from "@/lib/auth/session";
import { listResumes } from "@/features/resumes/queries";
import { PortfolioGallery } from "@/features/portfolio/portfolio-gallery";

export const metadata = { title: "Executive Portfolio Gallery" };

export default async function PortfolioPage() {
  const user = await requireUser();
  const resumes = await listResumes(user.id);
  return <PortfolioGallery resumes={resumes} />;
}
