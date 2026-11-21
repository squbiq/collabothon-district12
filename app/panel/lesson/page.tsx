// app/panel/lesson/page.tsx
export default function LessonAdminIndexPage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-extrabold text-foreground">Lessons</h1>
      <p className="font-medium text-muted-foreground">
        Pick a stage from the menu to edit it, use the pencil to edit lesson details, or create a new lesson.
      </p>
    </div>
  );
}
