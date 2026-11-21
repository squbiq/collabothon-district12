import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/style/globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets:['latin'],variable:'--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finanz.io | Start investing with our help",
  description: "Web application to help lerning how to invest",
  icons: {
    icon: "logo-solo.svg"
  }
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="w-full! h-full! m-0 p-0 box-border">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
