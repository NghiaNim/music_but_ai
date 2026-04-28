import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { TastePageBack } from "./_components/taste-page-back";
import { TasteProfileContent } from "./_components/taste-profile-content";

export default async function TasteProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in?callbackUrl=/profile/taste");
  }

  return (
    <div className="mx-auto max-w-lg px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-8">
      <TastePageBack />
      <h1 className="text-3xl font-bold tracking-tight">Your taste</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        How we picture your musical fingerprint
      </p>
      <TasteProfileContent />
    </div>
  );
}
