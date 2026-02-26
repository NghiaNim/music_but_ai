import { ProfileContent } from "./_components/profile-content";

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-lg px-5 py-6 pb-24">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <ProfileContent />
    </div>
  );
}
