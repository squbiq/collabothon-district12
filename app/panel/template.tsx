// Zawartość panelu przechodzi z blurem i przesunięciem; nawigacja panelu (layout) stoi w miejscu.
import { ViewTransition } from "react";

export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "to-app": "content-in-late", "to-panel": "content-in-late", default: "content-in" }}
      exit="content-out"
      default="none"
    >
      <div className="flex w-full flex-1 justify-evenly items-start">{children}</div>
    </ViewTransition>
  );
}
