import { WaitlistForm } from "./_components/waitlist-form";

export default function WaitlistPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-md flex-col px-4 py-6">
      <h1 className="text-2xl font-semibold">Join the waitlist</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Sign up to get updates from Classica.
      </p>

      <div className="mt-5">
        <WaitlistForm />
      </div>
    </div>
  );
}
