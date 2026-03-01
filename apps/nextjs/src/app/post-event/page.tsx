import { getSession } from "~/auth/server";
import { PostEventForm } from "./_components/post-event-form";

export default async function PostEventPage() {
  const session = await getSession();
  const isSignedIn = !!session;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Post an Event</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Share your upcoming recital, concert, or performance
      </p>
      <PostEventForm isSignedIn={isSignedIn} />
    </div>
  );
}
