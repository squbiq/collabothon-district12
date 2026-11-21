// Link powrotu do mapy lekcji.
import Link from "next/link";
import { chunkyButtonVariants } from "@/components/shared/chunky-button";

export function BackLink() {
  return (
    <Link href="/lesson-map" className={chunkyButtonVariants({ size: "lg", tone: "success" })}>
      Back to lessons
    </Link>
  );
}
