// src/app/flashcards/page.tsx
/**
 * Flashcards page (client component)
 *
 * WHAT IT DOES
 * - Renders three columns: Chat (left), Flashcards (middle), Upload (right).
 * - Holds local state for flashcards, card flipping, and a text input (genText) for generation.
 * - Calls the server API `/api/flashcards` to generate cards from free text (generateFromText).
 * - (Optional) If your Upload component yields an `uploadId`, you can call generateFromUpload
 *   to generate + persist cards tied to that upload.
 *
 * KEY NOTES
 * - The API returns items with keys { question_front, answer_back }.
 *   We map them into the local display shape { question, answer }.
 * - Ensure the endpoint path is exactly `/api/flashcards` (all lowercase, plural).
 */
"use client";

import { useState, useRef } from "react";
import ChatUI from "@/components/DashBoard/ChatUI";
import Upload from "@/components/DashBoard/Upload";

type Flashcard = {
  question: string;
  answer: string;
};

// LLM API returns these keys; we map → Flashcard
type ApiFlashcard = { question_front: string; answer_back: string };

export default function DashboardPage() {
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { question: "What is React?", answer: "A JavaScript library for building UIs" },
    { question: "What is Next.js?", answer: "A React framework for server-side rendering" },
    { question: "What is a hook?", answer: "A function to use state or lifecycle features in React" },
  ]);

  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  // generation of UI state 
  const [genText, setGenText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.min(Math.max(e.clientX, 200), window.innerWidth - 300);
    setChatWidth(`${newWidth}px`);
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };

  const toggleFlip = (index: number) => {
    setFlippedIndex(flippedIndex === index ? null : index);
  };

  // LLM calls
  async function generateFromText() {
    if (!genText.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/flashCards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: genText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");

      // map API keys → your local shape
      const cards = (data.flashcards as ApiFlashcard[]).map(fc => ({
        question: fc.question_front,
        answer: fc.answer_back,
      }));
      setFlashcards(cards);
      setFlippedIndex(null);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  
  // If the Upload component can give an uploadId, call this:
  async function generateFromUpload(uploadId: number) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");

      const cards = (data.flashcards as ApiFlashcard[]).map(fc => ({
        question: fc.question_front,
        answer: fc.answer_back,
      }));
      setFlashcards(cards);
      setFlippedIndex(null);
    } catch (e: any) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className=" h-screen w-full flex gap-10 pl-10 pr-0">
      {/* Left: Chat */}
      <div className=" rounded-3xl bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full pb-10 pt-14"
        style={{ width: chatWidth }}
      >
        <ChatUI />
      </div>

      {/* Divider / Resizer */}
      <div
        onMouseDown={startResizing}
        className="w-1 cursor-col-resize opacity-30 bg-white hover:bg-gray-400 rounded relative"
      >
      </div>

      {/* Middle: Flashcards */}
      <div className="rounded-3xl p-6 bg-black/70 overflow-y-auto mt-19 mb-5 flex-grow flex justify-center items-start">
        <div className="flex flex-col snap-y snap-mandatory gap-4 p-4 w-full items-center">
          {flashcards.map((card, index) => (
            <div
              key={index}
              onClick={() => toggleFlip(index)}
              className="snap-center cursor-pointer border rounded-lg shadow hover:shadow-lg transition-all text-black flex items-center justify-center text-center
                    w-full max-w-lg aspect-square p-6"
              style={{
                flexShrink: 0,
                background: 'radial-gradient(circle at center, #ffffff, rgb(167, 200, 255))',
              }}
            >
              {flippedIndex === index ? card.answer : card.question}
            </div>
          ))}
        </div>
      </div>


      {/* Right: Upload */}
      <div className="border border-white/30 p-2 bg-white/30 pb-0 backdrop-blur-md rounded-md shadow-md overflow-y-auto w-[10vw]">
        <Upload onSaved={() => { }} />
      </div>
    </div>
  );
}
