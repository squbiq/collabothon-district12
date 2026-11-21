import { UserProvider } from "@/components/context/user-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <UserProvider>
        <TooltipProvider delay={250}>{children}</TooltipProvider>
        <Toaster />
      </UserProvider>
    </ThemeProvider>
  )
}