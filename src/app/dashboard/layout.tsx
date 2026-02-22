import type { ReactNode } from "react";
import {getSessionUser} from  "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

/** Dashboard React Component
 * @description 
 * Server side component.
 * Defines the dashboard layout for authenticated users,
 * otherwise redirects to home page.
 * @returns {JSX.Element} The rendered component
 */
export default async function AIPageLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if(!user){
    redirect("/");
  }
  return (
    <div className="min-h-screen flex flex-col">
        <main className="container mx-auto max-w-5xl px-4 py-8 flex-1">
          {children}
        </main>
    </div>
  );
}
