// Szablon renderuje się od nowa przy każdej nawigacji, więc <ViewTransition> animuje samą zawartość strony.
// Nawigacja (layout) stoi w miejscu. Klasy: style/view-transition.css.
import { ViewTransition } from "react";

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "to-app": "content-in-late", "to-panel": "content-in-late", default: "content-in" }}
      exit={{ "to-app": "content-out", "to-panel": "content-out", default: "content-out" }}
      default="none"
    >
      {/* jeden element DOM, który tworzy snapshot */}
      {/* zawartość wyśrodkowana, a gdy jest wyższa niż ekran – zaczyna się od góry i przewija się w <main> */}
      <div className="flex min-h-full w-full flex-col items-center justify-center">{children}</div>
    </ViewTransition>
  );
}
