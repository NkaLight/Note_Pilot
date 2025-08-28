import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";
import Footer from "@/components/Footer";
import { SessionProvider } from "@/context/SessionContext";

export const metadata: Metadata = {
  title: "Note Pilot",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Nav/>
          <main>
            {children}
          </main>
          <Footer/>
        </SessionProvider>
      </body>
    </html>
  );
}
