
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { SessionProvider } from "@/context/SessionContext";
import ThemeInit from "@/components/Account/themeInit";
import { ThemeProviders } from "@/components/Account/themeProvider";
import { getSessionUser } from '@/lib/auth';
import { AuthContextProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Note Pilot",
  description: "",
};

export default async function RootLayout({children, showFooter = true}: Readonly<{children: React.ReactNode;}>) {
    const {user } = await getSessionUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
      <ThemeProviders attribute="class" defaultTheme="light" enableSystem={false}>
          <SessionProvider initialUser={user}>{/*Store User object as context for gobal accessiblity to add to user object see @/lib/auth & context/SessionContext.tsx ensure both remain compatible*/}
            <ThemeInit /> {/* syncs theme to user preference if available */}
              <AuthContextProvider initialAuth="">
                <Nav />
                <main>{children}</main>
              </AuthContextProvider>
          </SessionProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}


