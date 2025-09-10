
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";
import Footer from "@/components/Footer";
import { SessionProvider } from "@/context/SessionContext";
import ThemeInit from "@/components/Account/themeInit";
import { ThemeProviders } from "@/components/Account/themeProvider";


export const metadata: Metadata = {
  title: "Note Pilot",
  description: "",
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <body>
      <ThemeProviders attribute="class" defaultTheme="light" enableSystem={false}>
          <SessionProvider>
            <ThemeInit /> {/* syncs theme to user preference if available */}
            <Nav />
            <main>{children}</main>
            <Footer />
          </SessionProvider>
        </ThemeProviders>
      </body>
    </html>
  );
}