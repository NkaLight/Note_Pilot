// src/app/flashcards/page.tsx
"use client";

import ChatUI from "@/components/DashBoard/ChatUI";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Flashcard = {
  question: string;
  answer: string;
  learnt?: boolean;
};

type ApiFlashcard = {
  question_front: string;
  answer_back: string;
};

export default function FlashcardsPage() {
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);
  const { chosenLectureId, lectures, selectedLectureIds } = usePaperViewContext();
  const params = useParams();
  const paperId = params?.paperId ? Number(params.paperId) : null;

  const selectedLecture = lectures?.find((l) => l.id === chosenLectureId);
  const selectedUploadIds = selectedLectureIds;

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- Resizing Chat Panel ---
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

  // --- Card Flip ---
  const toggleFlip = (i: number) => setFlippedIndex(flippedIndex === i ? null : i);

  // --- Toggle Learnt ---
  const toggleLearnt = (i: number) => {
    setFlashcards((prev) => {
      const updated = [...prev];
      updated[i].learnt = !updated[i].learnt;
      return updated;
    });
  };

  // --- Create Flashcards ---
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

  // --- Load flashcards on mount ---
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

  // --- Progress ---
  const learntCount = flashcards.filter((fc) => fc.learnt).length;
  const totalCount = flashcards.length;

  return (
    <div className="h-screen w-full flex gap-10 pl-10 pr-0">
      {/* Left: Chat */}
      <div
        className="rounded-3xl bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full pb-10 pt-14"
        style={{ width: chatWidth }}
      >
        <ChatUI
          onMakeFlashcards={makeFlashcardsFrom}
          uploadIds={selectedUploadIds}
          paperId={paperId}
        />
      </div>

      {/* Divider / Resizer */}
      <div
        onMouseDown={startResizing}
        className="w-1 cursor-col-resize opacity-30 bg-white hover:bg-gray-400 rounded relative"
      />

      {/* Middle: Flashcards */}
<div className="relative rounded-3xl p-6 overflow-y-auto mt-19 mb-5 flex-grow flex justify-center items-start pr-10">
  <div className="flex flex-col snap-y snap-mandatory gap-4 p-4 w-full items-center">
    {loading && <p className="text-white/80">Generating flashcards…</p>}
    {err && <p className="text-red-300">{err}</p>}
    {!loading && flashcards.length === 0 && (
      <p className="text-white/70">
        No flashcards yet — ask the AI and hit “Create Flashcards”.
      </p>
    )}
    {flashcards.map((card, index) => (
      <div
        key={index}
        onClick={() => toggleFlip(index)}
        className="snap-center cursor-pointer border rounded-lg shadow hover:shadow-lg transition-all flex flex-col items-center justify-center text-center w-full max-w-lg aspect-square p-6 relative"
        style={{
          flexShrink: 0,
          background: `radial-gradient(circle at center, var(--bg-start), var(--bg-mid))`,
          color: "var(--text)",
          borderColor: card.learnt ? "limegreen" : "rgba(255,255,255,0.2)",
        }}
      >
        <div className="flex-1 flex items-center justify-center">
          {flippedIndex === index ? card.answer : card.question}
        </div>

        {/* Learnt button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFlashcards((prev) => {
              const newCards = [...prev];
              newCards[index] = { ...newCards[index], learnt: !newCards[index].learnt };
              return newCards;
            });
          }}
          className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
            card.learnt
              ? "bg-green-500 text-white"
              : "bg-white/30 text-black dark:text-white"
          }`}
        >
          {card.learnt ? "Learnt ✅" : "Mark Learnt"}
        </button>
      </div>
    ))}
  </div>
</div>
    </div>
  );
}
