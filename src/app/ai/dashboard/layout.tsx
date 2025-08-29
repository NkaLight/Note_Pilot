// src/app/ai/dashboard/layout.tsx
import type { ReactNode } from "react";
import {redirect} from "next/navigation";
import { cookies } from "next/headers";

export default async function AIPageLayout({ children }: { children: ReactNode }) {

  const cookieStore = cookies()
  //Validate session 
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/validate_session`, {
    headers: {
      Cookie: cookieStore.toString(), 
    },
    cache: "no-store", // don't cache session checks
  })
  if(!res.ok){ //check valid response
    redirect("/") //In the future we can direct the user to a 404 page, depends
  }

  const { user } = await res.json();

  if (!user) { //check valid user.
    redirect("/")
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav is a client component; importing in a server layout is fine */}
      <main className="container mx-auto max-w-5xl px-4 py-8 flex-1">{children}</main>
    </div>
  );
}
