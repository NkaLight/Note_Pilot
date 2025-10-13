// src/app/flashcards/page.tsx
/**
 * FlashcardsPage
 *
 * WHAT IT DOES
 * - Layout with 3 panels:
 *   (1) ChatUI on the left
 *   (2) Flashcards in the middle
 *   (3) Upload widget on the right
 * - Lets the user click " Create Flashcards" on ChatUI → calls /api/flashcards
 * - Maps API response into flashcard cards that flip on click.
 */
"use client";

import ChatUI from "@/components/DashBoard/ChatUI";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Flashcard = { question: string; answer: string };
type ApiFlashcard = { question_front: string; answer_back: string };

export default function FlashcardsPage() {
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);
  const {chosenLectureId, lectures, selectedLectureIds} = usePaperViewContext();
  const params = useParams();
  const paperId = params?.paperId ? Number(params.paperId) : null;

  // Get the current selected lecture's upload ID
  const selectedLecture = lectures?.find(lecture => lecture.id === chosenLectureId);
  const uploadId = selectedLecture?.id || null;
  // Use selected lecture IDs as upload IDs for context
  const selectedUploadIds = selectedLectureIds;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  const [genText, setGenText] = useState(""); // (optional free-text box if you keep it)
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
  const toggleFlip = (i: number) => setFlippedIndex(flippedIndex === i ? null : i);

  // Core: take some text and ask the server to make flashcards
  async function makeFlashcardsFrom(text: string) {
    if (!text?.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate");

      const cards = (data.flashcards as ApiFlashcard[]).map((fc) => ({
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
 // adds persistence to the flashcards when the page is refreshed
  useEffect(() => {
    async function loadFlashcards() {
      try {
        const res = await fetch("/api/flashcards");
        if (!res.ok) throw new Error("Failed to load flashcards");
        const data = await res.json();
        if (data.flashcards) {
          setFlashcards(
            data.flashcards.map((fc: any) => ({
              question: fc.question_front,
              answer: fc.answer_back,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading flashcards:", err);
      }
    }
  
    loadFlashcards();
  }, []);

  return (
    <div className="h-screen w-full flex gap-10 pl-10 pr-0">
      {/* Left: Chat */}
      <div
        className="rounded-3xl bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full pb-10 pt-14"
        style={{ width: chatWidth }}
      >
        {/* ✨ Pass the callback down */}
        <ChatUI onMakeFlashcards={makeFlashcardsFrom} uploadIds={selectedUploadIds} paperId={paperId} />
      </div>

      {/* Divider / Resizer */}
      <div
        onMouseDown={startResizing}
        className="w-1 cursor-col-resize opacity-30 bg-white hover:bg-gray-400 rounded relative"
      />

      {/* Middle: Flashcards */}
      <div className="rounded-3xl p-6 bg-black/70 overflow-y-auto mt-19 mb-5 mr-10 flex-grow flex justify-center items-start">
        <div className="flex flex-col snap-y snap-mandatory gap-4 p-4 w-full items-center">
          {loading && <p className="text-white/80">Generating flashcards…</p>}
          {err && <p className="text-red-300">{err}</p>}
          {!loading && flashcards.length === 0 && (
            <p className="text-white/70">No flashcards yet — ask the AI and hit “Create Flashcards”.</p>
          )}
          {flashcards.map((card, index) => (
            <div
              key={index}
              onClick={() => toggleFlip(index)}
              className="snap-center cursor-pointer border rounded-lg shadow hover:shadow-lg transition-all text-black flex items-center justify-center text-center w-full max-w-lg aspect-square p-6"
              style={{
                flexShrink: 0,
                background: "radial-gradient(circle at center, #ffffff, rgb(167, 200, 255))",
              }}
            >
              {flippedIndex === index ? card.answer : card.question}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
