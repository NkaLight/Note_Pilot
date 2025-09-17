"use client";

import { useState, useRef } from "react";
import ChatUI from "@/components/DashBoard/ChatUI";
import Upload from "@/components/DashBoard/Upload";

type Flashcard = {
  question: string;
  answer: string;
};

export default function DashboardPage() {
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { question: "What is React?", answer: "A JavaScript library for building UIs" },
    { question: "What is Next.js?", answer: "A React framework for server-side rendering" },
    { question: "What is a hook?", answer: "A function to use state or lifecycle features in React" },
  ]);

  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

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

  return (
    <div className="h-screen w-full flex gap-4 pl-4 pr-0 pt-0 pb-0">
      {/* Left: Chat */}
      <div
        className="border rounded-2xl p-6 bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full"
        style={{ width: chatWidth }}
      >
        <ChatUI />
      </div>

      {/* Divider / Resizer */}
      <div
        onMouseDown={startResizing}
        className="w-1 cursor-col-resize bg-gray-300 hover:bg-gray-400 rounded"
      />

      {/* Middle: Flashcards */}
      <div className="border rounded-2xl p-6 bg-gray-50 overflow-y-auto mt-5 flex-grow flex justify-center items-start">
        <div className="flex flex-col snap-y snap-mandatory gap-4 p-4 w-full items-center">
          {flashcards.map((card, index) => (
            <div
              key={index}
              onClick={() => toggleFlip(index)}
              className="snap-center cursor-pointer border rounded-lg shadow hover:shadow-lg transition-all bg-white text-black flex items-center justify-center text-center
                         w-full max-w-lg aspect-square p-6"
              style={{ flexShrink: 0 }}
            >
              {flippedIndex === index ? card.answer : card.question}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Upload */}
      <div className="border border-white/30 p-2 bg-white/30 pb-0 backdrop-blur-md rounded-md shadow-md overflow-y-auto w-[10vw]">
        <Upload onSaved={() => {}} />
      </div>
    </div>
  );
}
