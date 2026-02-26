import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@acme/ui/button";

import { auth, getSession } from "~/auth/server";

export async function AuthHeader() {
  const session = await getSession();

  if (!session) {
    return (
      <Button size="sm" variant="outline" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground max-w-[100px] truncate text-xs">
        {session.user.name}
      </span>
      <form>
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground h-7 px-2 text-xs"
          formAction={async () => {
            "use server";
            await auth.api.signOut({
              headers: await headers(),
            });
            redirect("/");
          }}
        >
          Sign out
        </Button>
      </form>
    </div>
  );
}
