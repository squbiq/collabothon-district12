// app/panel/lesson/[id]/[stageId]/page.tsx
//
// Edycja wybranego etapu (stage'a) lekcji.
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getStageForEdit } from "@/lib/lesson/admin-queries";
import { StageForm } from "@/components/feature/lesson/admin/stage-form";

type Params = Promise<{ id: string; stageId: string }>;

async function EditStageContent({ params }: { params: Params }) {
  const { id, stageId } = await params;
  const data = await getStageForEdit(id, stageId);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground">Edit stage {data.position}</h1>
        <p className="font-medium text-muted-foreground">{data.lessonTitle}</p>
      </header>
      <StageForm key={data.stage.id} lessonId={id} stage={data.stage} />
    </div>
  );
}

export default function EditStagePage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <EditStageContent params={params} />
    </Suspense>
  );
}
