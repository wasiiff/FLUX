import Link from "next/link";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata = { title: "Request Access" };

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-background text-on-background antialiased">
      <div className="hidden md:flex flex-col w-1/2 relative bg-surface-container-low border-r border-outline-variant p-section-gap">
        <div className="font-h3 text-h3 font-medium text-primary tracking-tight">FLUX</div>
        <div className="mt-auto max-w-md">
          <h1 className="font-h1 text-h1 text-on-surface mb-gutter">
            Onboarding for the next chapter of your career.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Five minutes from now, your first ATS-optimized executive resume will be ready for
            broadcast.
          </p>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center px-gutter py-section-gap bg-surface-container-lowest">
        <div className="w-full max-w-[420px] mx-auto">
          <div className="mb-margin">
            <h2 className="font-h2 text-h2 text-on-surface mb-unit">Request Access</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Create your Strategy Suite. No credit card required.
            </p>
          </div>
          <SignUpForm />
          <div className="mt-margin text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-primary font-medium hover:underline underline-offset-4 decoration-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
