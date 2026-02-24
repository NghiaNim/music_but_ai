import { HydrateClient } from "~/trpc/server";
import { AuthShowcase } from "../_components/auth-showcase";
import { ProfileContent } from "./_components/profile-content";

export default function ProfilePage() {
  return (
    <HydrateClient>
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Your account and preferences
        </p>
        <div className="flex flex-col gap-6">
          <section className="bg-card rounded-xl border p-4">
            <h2 className="mb-3 text-sm font-semibold">Account</h2>
            <AuthShowcase />
          </section>
          <ProfileContent />
        </div>
      </div>
    </HydrateClient>
  );
}
