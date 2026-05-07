import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/icon";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <nav className="flex items-center justify-between px-12 h-16 border-b border-outline-variant">
        <span className="font-h3 text-h3 font-medium tracking-tight text-primary">FLUX</span>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors">
            Sign In
          </Link>
          <Button asChild size="sm">
            <Link href="/sign-up">Request Access</Link>
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center py-section-gap">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-outline-variant text-on-surface-variant">
            <MaterialSymbol name="auto_awesome" opticalSize={20} />
            <span className="font-label-caps text-label-caps">AI-Native Resume Operating System</span>
          </div>
          <h1 className="font-h1 text-h1 text-on-surface mb-6">
            Architect your professional narrative.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-2xl mx-auto">
            FLUX is the executive-grade resume platform built for senior professionals who refuse to
            be screened out. Surgical ATS optimization, live AI rewriting, and broadcast-ready exports.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Begin Optimization <MaterialSymbol name="arrow_forward" opticalSize={20} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="px-12 py-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-label-caps text-label-caps text-on-surface-variant">
          © {new Date().getFullYear()} FLUX. ALL RIGHTS RESERVED.
        </p>
        <nav className="flex gap-6 font-label-caps text-label-caps">
          <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors">Privacy</Link>
          <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors">Terms</Link>
          <Link href="#" className="text-on-surface-variant hover:text-primary transition-colors">Support</Link>
        </nav>
      </footer>
    </div>
  );
}
