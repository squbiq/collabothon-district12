// app/panel/page.tsx
//
// Na razie jedyną funkcją panelu jest zarządzanie lekcjami.
import { redirect } from "next/navigation";

export default function PanelPage() {
  redirect("/panel/lesson");
}
