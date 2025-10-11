
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";
import Footer from "@/components/Footer";
import { SessionProvider } from "@/context/SessionContext";
import ThemeInit from "@/components/Account/themeInit";
import { ThemeProviders } from "@/components/Account/themeProvider";
import { cookies } from "next/headers";
import { getSessionUser } from '@/lib/auth';
import { redirect } from "next/navigation";


export const metadata: Metadata = {
  title: "Note Pilot",
  description: "",
};

export default async function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
    const sessionToken = (await cookies()).get('session_token')?.value ?? null;
    const user = sessionToken ? await getSessionUser() : null;

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
      <ThemeProviders attribute="class" defaultTheme="light" enableSystem={false}>
          <SessionProvider initialUser={user}>{/*Store User object as context for gobal accessiblity to add to user object see @/lib/auth & context/SessionContext.tsx ensure both remain compatible*/}
            <ThemeInit /> {/* syncs theme to user preference if available */}
            <Nav />
            <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
            <Footer />
          </SessionProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}


