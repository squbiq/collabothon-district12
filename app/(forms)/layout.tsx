export default function FormsLayout({ children }: LayoutProps<"/">) {
  return (
    <section className="w-full h-full flex justify-center items-center">
      {children}
    </section>
  );
}