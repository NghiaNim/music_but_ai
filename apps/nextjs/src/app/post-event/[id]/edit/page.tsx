import { Suspense } from "react";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { PostEventEditForm } from "../../_components/post-event-form";

export default async function EditHostedEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center text-sm">
        <p className="mb-3">Sign in to edit your event.</p>
        <a
          href={`/sign-in?callbackUrl=${encodeURIComponent(`/post-event/${id}/edit`)}`}
          className="text-primary font-medium underline"
        >
          Sign in
        </a>
      </div>
    );
  }

  prefetch(trpc.event.byId.queryOptions({ id }));

  return (
    <HydrateClient>
      <div className="mx-auto max-w-lg px-4 py-6 pb-24">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Edit event</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Update details or cancel your listing. Subscribers can be emailed when
          you cancel or when you opt in on save.
        </p>
        <Suspense
          fallback={
            <div className="bg-muted h-40 animate-pulse rounded-xl border" />
          }
        >
          <PostEventEditForm eventId={id} />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
