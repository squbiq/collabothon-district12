export default function FormsLayout({ children }: LayoutProps<"/">) {
  return (
    <section className="flex flex-col w-full h-full">
        {children}
    </section>
  );
}