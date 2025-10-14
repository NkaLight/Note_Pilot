import type { ReactNode } from "react";
import {getSessionUser} from  "@/lib/auth"
import { redirect } from "next/navigation";

/** Account Page React Component
 * @description This component defines the layout for the user account page.
 * @returns {JSX.Element} The rendered component
 */
export default async function AccountPage({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if(!user){
    redirect("/") // Enforce Authenticated users accessing this page
  }
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav is a client component; importing in a server layout is fine */}
      <main className="container mx-auto max-w-5xl px-4 py-8 flex-1">{children}</main>
    </div>
  );
}
