import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-bright text-on-surface-variant font-label-caps text-label-caps full-width border-t border-outline-variant flex flex-col md:flex-row justify-between items-center px-margin py-6 w-full mt-auto">
      <div>© {new Date().getFullYear()} FLUX. ALL RIGHTS RESERVED.</div>
      <nav className="flex gap-6 mt-4 md:mt-0">
        <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
        <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
        <Link href="#" className="hover:text-primary transition-colors">Executive Support</Link>
      </nav>
    </footer>
  );
}
