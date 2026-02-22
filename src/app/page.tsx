import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Button from "@/components/TryForFreeButton";

export default async function LandingPage() {
  const sessionToken = (await cookies()).get("session_token")?.value ?? null;
  const user = sessionToken ? await getSessionUser() : null;

  if (user) {
    redirect("/dashboard"); // Redirect if signed in
  }

  const bentoBoxes = [
    {
      title: "Flashcards in Minutes",
      description:
        "Automatically generate flashcards from your lecture notes or summaries and boost your recall.",
      icon: "📇",
    },
    {
      title: "Smart Summaries",
      description:
        "Condense long lecture notes into concise, AI-generated summaries for faster review.",
      icon: "📝",
    },
    {
      title: "Practice Problems",
      description:
        "Generate relevant practice problems to test your understanding and prepare for exams.",
      icon: "🧩",
    },
    {
      title: "Glossary Builder",
      description:
        "Quickly create a glossary of key terms to strengthen your subject knowledge.",
      icon: "📚",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="max-w-2xl mt-50 mb-20 w-full space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          Study smarter, not harder.
          <span className="block text-blue-600">With AI by your side.</span>
        </h1>

        <p className="text-gray-700 text-base sm:text-lg md:text-xl leading-relaxed">
          Summarize lectures, generate flashcards, and create practice problems—
          all in minutes.
        </p>

        <div className="pt-4">
          <Button/>
        </div>
      </div>

      {/* Bento Boxes Section */}
      <div className="mt-16 mb-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {bentoBoxes.map((box, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-4xl mb-4">{box.icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">{box.title}</h3>
            <p className="text-gray-600 text-sm sm:text-base">{box.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
