import { PostEventForm } from "./_components/post-event-form";

export default function PostEventPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Post an Event</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Share your upcoming recital, concert, or performance
      </p>
      <PostEventForm />
    </div>
  );
}
