import type { ReactNode } from "react";
import {getSessionUser} from  "@/lib/auth"
import { redirect } from "next/navigation";
import React from "react";
import type {paper} from "@prisma/client";
import { getPapersByUserId } from "@/lib/paper";

/** Dashboard React Component
 * @description 
 * Server side component.
 * Defines the dashboard layout for authenticated users,
 * otherwise redirects to home page.
 * @returns {JSX.Element} The rendered component
 */
export default async function AIPageLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  console.log(user);
  if(!user){
    redirect("/")
  }
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav is a client component; importing in a server layout is fine */}
        <main className="container mx-auto max-w-5xl px-4 py-8 flex-1">
          {children}
        </main>
    </div>
  );
}
