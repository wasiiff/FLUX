import { requireUser } from "@/lib/auth/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <main className="flex-1 p-margin max-w-3xl mx-auto w-full">
      <header className="mb-section-gap">
        <h1 className="font-h1 text-h1 text-on-surface mb-2">Account</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Manage your profile and preferences.
        </p>
      </header>

      <section className="border border-outline-variant bg-surface-container-lowest p-8 mb-gutter">
        <div className="flex items-center gap-6 mb-6">
          <Avatar className="h-16 w-16">
            {user.image ? <AvatarImage src={user.image} alt={user.name ?? user.email} /> : null}
            <AvatarFallback>{(user.name ?? user.email).slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-h3 text-h3 text-on-surface">{user.name ?? "Anonymous"}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div>
            <Label>Display Name</Label>
            <Input defaultValue={user.name ?? ""} />
          </div>
          <div>
            <Label>Email</Label>
            <Input defaultValue={user.email} disabled />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </section>

      <section className="border border-outline-variant bg-surface-container-lowest p-8">
        <h2 className="font-h3 text-h3 text-on-surface mb-6">Preferences</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-data-tabular text-data-tabular text-on-surface">Appearance</p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Switch between editorial light mode and AI-native dark mode.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>
    </main>
  );
}
