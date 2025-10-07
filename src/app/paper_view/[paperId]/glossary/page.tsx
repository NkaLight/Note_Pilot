"use client";
/**
 * Glossary Page (client-side)
 *
 * WHAT IT DOES:
 * - Renders a layout similar to Flashcards (Chat | Glossary | Upload)
 * - Lets the user enter custom text and send it to /api/glossary
 * - Displays generated glossary terms and definitions from the LLM
 *
 * FUTURE DB INTEGRATION:
 * - When DB access is restored, generation should be tied to an uploadId.
 * - The glossary items will be persisted in the `glossary` table
 *   and associated with the user's uploaded papers.
 */

import { useState, useRef } from "react";
import ChatUI from "@/components/DashBoard/ChatUI";
import Upload from "@/components/DashBoard/Upload";
import Summary from "@/components/DashBoard/Summary";

type GlossaryItem = {
  term: string;
  definition: string;
};

export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);

  // Local UI state
  const [inputText, setInputText] = useState("");
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing.current) return;

    // Minimum 200px, maximum viewport - 300px (so summaries don't collapse too much)
    const newWidth = Math.min(Math.max(e.clientX, 200), window.innerWidth - 300);
    setChatWidth(`${newWidth}px`);
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };

  // Generate glossary via API call to /api/glossary
  async function generateGlossary() {
    if (!inputText.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate glossary");

      setGlossary(data.glossary);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-full flex gap-10 pl-10 pr-0">
      {/* Left: Chat */}
      <div
        className="rounded-3xl bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full pb-10 pt-14"
        style={{ width: chatWidth }}
      >
        <ChatUI />
      </div>

      {/* Divider / Resizer */}
      <div
        onMouseDown={startResizing}
        className="w-1 cursor-col-resize opacity-30 bg-white hover:bg-gray-400 rounded relative"
      />

      {/* Middle: Glossary */}
      <div className="rounded-3xl mb-5 mt-19 p-6 bg-white/50 overflow-y-auto mt-5 flex-grow text-black">
        <h2 className="text-xl font-semibold mb-4 text-black">Glossary</h2>

        {/* Input + Generate button */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Enter notes or text to extract terms..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-lg p-2 text-black"
          />
          <button
            onClick={generateGlossary}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {/* Error display */}
        {err && <p className="text-red-500 mb-2">{err}</p>}

        {/* Render glossary results */}
        <div className="space-y-4">
          {glossary.length > 0 ? (
            glossary.map((item, idx) => (
              <div
                key={idx}
                className="bg-white/80 rounded-lg p-3 shadow-md hover:shadow-lg transition-all"
              >
                <p className="font-semibold text-lg text-blue-700">{item.term}</p>
                <p className="text-gray-800">{item.definition}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No glossary generated yet.</p>
          )}
        </div>
      </div>

      {/* Right: Upload */}
      <div className="border border-white/30 p-2 bg-white/30 pb-0 backdrop-blur-md rounded-md shadow-md overflow-y-auto w-[10vw]">
        <Upload onSaved={() => { }} />
      </div>
    </div>
  );
}
