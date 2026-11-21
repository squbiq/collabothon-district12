// app/panel/daily-lesson/new/page.tsx
import { DailyTaskForm } from "@/components/feature/daily/admin/daily-task-form";
import { BackToList } from "@/components/feature/daily/admin/back-to-list";

export default function NewDailyTaskPage() {
  return (
    <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6 px-8 pb-10">
      <header className="flex flex-col gap-1">
        <BackToList />
        <h1 className="text-3xl font-extrabold text-foreground">New daily task</h1>
      </header>
      <DailyTaskForm />
    </div>
  );
}
