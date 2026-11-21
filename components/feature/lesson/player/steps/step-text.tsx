// Wspólny styl długiego tekstu w krokach lekcji.
export function StepText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-lg leading-relaxed font-medium whitespace-pre-line text-foreground/80">
      {children}
    </p>
  );
}
