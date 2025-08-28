"use client"
import { cookies } from "next/headers";
import { redirect, useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { useEffect } from "react";

export default function LandingPage() {

      const {user} = useSession();
      const router =  useRouter();

      //If session_token exists, redirect to dashboard
       useEffect(()=>{
        if(user){
          router.push("/ai/dashboard")
        }
       }, [user, router])

  return (
    <div className="flex flex-col items-center p-2 my-0">
      <div className="landing-page-sections-container">
        <h1>Study smarter not,harder. With AI by your side</h1>
        <p>Summarize lectures, generate flashcards, and create practice problems—in minutes.</p>
        <a className="landing-cta-btn"  href="/signUp">Try for free</a>
      </div>
    </div>
  );
}
