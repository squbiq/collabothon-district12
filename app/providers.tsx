import { UserProvider } from "@/components/context/user-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <UserProvider>
        {children}
        <Toaster />
      </UserProvider>
    </ThemeProvider>
  )
}