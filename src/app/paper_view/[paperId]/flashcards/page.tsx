// src/app/flashcards/page.tsx
/**
 * FlashcardsPage
 *
 * WHAT IT DOES
 * -Renders the FlashCards blob. 
 * - on Mount, we perform GET request to /api/flashcards, on flashcards.length == 0:
 *      Generate the flashcards and return the flashcards to be rendered. 
 *
 */
"use client";

import React, { useState, useEffect } from "react";
import ChatUI from "@/components/DashBoard/ChatUI";
import Upload from "@/components/DashBoard/Upload";
import StudyLayout from "@/components/DashBoard/StudyLayout";
import { usePaperViewContext } from "@/context/PaperViewContext";

type Flashcard = { question: string; answer: string };
type ApiFlashcard = { question_front: string; answer_back: string };

export default function FlashcardsPage() {
  // Flashcards state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const {chosenLectureId} = usePaperViewContext();

  const toggleFlip = (i: number) => setFlippedIndex(flippedIndex === i ? null : i);

  //Given chosenId(uploadId), generate + persist
  async function makeFlashcardsFromUpload(uploadId: number) {
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

      const cards = (data.flashcards as ApiFlashcard[]).map((fc) => ({
        question: fc.question_front,
        answer: fc.answer_back,
      }));
      setFlashcards(cards);
    } catch (e: any) {
      console.log(`makeFlashcards error ${e.message}`);
      setErr("Error Generating flashcards");
    }
  }

  useEffect(()=>{
    const syncFlashCards = async()=>{
      if(!chosenLectureId) return;
      setLoading(true);
      setErr(null);
      try{
        const res = await fetch(`/api/flashcards?uploadId=${chosenLectureId}`);
        const data = await res.json();
         if(res.ok && data.flashcards && data.flashcards.length > 0){
          const mappedCards = (data.flashcards as ApiFlashcard[]).map((fc) => ({
            question: fc.question_front,
            answer: fc.answer_back,
          }));
          setFlashcards(mappedCards);
         }else{
          // 3. Fallback: If no cards exist, trigger the generator (POST)
          await makeFlashcardsFromUpload(chosenLectureId);
         }
      }catch(error){
        console.error("Sync error:", error);
        setErr("Failed to sync flashcards");
      }finally{
        setLoading(false);
      }
    };
    syncFlashCards();
  }, [chosenLectureId]);

  return (
    <StudyLayout>
       <div className="flex flex-col snap-y snap-mandatory gap-4 p-4 w-full items-center">
           {loading && err === null && <p className="text-white/80">Generating flashcards…</p>}
           {err && <p className="text-red-300">{err}</p>}
           {!loading && err === null && flashcards.length  === 0 && (
             <p className="text-white/70">No flashcards yet click a lecture to load flashcards.</p>
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
    </StudyLayout>
  );
}