import Link from "next/link";
import Image from "next/image";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata = { title: "Sign In" };

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-background text-on-background antialiased">
      {/* Editorial side */}
      <div className="hidden md:flex flex-col w-1/2 relative bg-surface-container-low border-r border-outline-variant">
        <div className="absolute inset-0">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtyd15qAVQM32ZrvezWLJSQfGV-XLg3XAQ2nZErAHIjCGAuhxGqln1jNB74hC21NRD0JvYYU7t9IbBOGsC5xe34uxWP5ipYpTQLTd_89J2adZ7ND8ipA44JAC_20H8ek6SZMKvR4IizACGiCByptE6CSQBBybYGJmv_k5NB8DkHvF3x7LSgN5mcy6vehwPjbzsxMEfL_4ReYOwah6i4SJIzG0aYGMBmPwgW9e9OFErvCBCkv5tdGCSHqUNZYKEACn4W9AlmM-JHbM"
            alt="Modern executive office"
            fill
            priority
            className="object-cover opacity-80 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-low opacity-90" />
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full p-section-gap">
          <div className="font-h3 text-h3 font-medium text-primary tracking-tight">FLUX</div>
          <div className="max-w-md">
            <h1 className="font-h1 text-h1 text-on-surface mb-gutter">
              Transform your career with strategic optimization.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Access elite tools designed for high-level professionals to architect, narrative,
              and broadcast their absolute best professional representation.
            </p>
          </div>
        </div>
      </div>

      {/* Auth canvas */}
      <div className="flex-1 flex flex-col justify-center px-gutter py-section-gap bg-surface-container-lowest">
        <div className="md:hidden mb-margin text-center">
          <span className="font-h3 text-h3 font-medium text-primary tracking-tight">FLUX</span>
        </div>
        <div className="w-full max-w-[420px] mx-auto">
          <div className="mb-margin">
            <h2 className="font-h2 text-h2 text-on-surface mb-unit">Sign In</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enter your credentials to access your Strategy Suite.
            </p>
          </div>
          <SignInForm />
          <div className="mt-margin text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-primary font-medium hover:underline underline-offset-4 decoration-1"
              >
                Request Access
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
