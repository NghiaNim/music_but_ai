import { notFound } from "next/navigation";

import { getModule, MODULES } from "../_lib/modules";
import { LearningModule } from "./_components/learning-module";

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const module = getModule(slug);
  if (!module) notFound();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <LearningModule module={module} />
    </div>
  );
}
