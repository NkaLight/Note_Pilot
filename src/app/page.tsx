
import { cookies } from "next/headers";
import { getSessionUser } from '@/lib/auth';
import { redirect } from "next/navigation";

export default async function LandingPage() {
      const sessionToken = (await cookies()).get('session_token')?.value ?? null;
      const user = sessionToken ? await getSessionUser() : null;

    if(user){
      redirect("/dashboard") //Check if the user is signed in.
    }

  return (
    <div className="flex flex-col items-center p-2 my-40">
      <div className="landing-page-sections-container">
        <h1>Study smarter not,harder. With AI by your side</h1>
        <p>Summarize lectures, generate flashcards, and create practice problems—in minutes.</p>
        <a className="landing-cta-btn"  href="/signUp">Try for free</a>
      </div>
    </div>
  );
}
