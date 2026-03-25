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
import { usePaperViewContext } from "@/context/PaperViewContext";
import { FlashcardBlock } from "@/components/UI_Blocks/FlashCardBlock";

type Flashcard = { question: string; answer: string };
type ApiFlashcard = { question_front: string; answer_back: string };

export default function FlashcardsPage() {
  // Flashcards state
   const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { chosenLectureId } = usePaperViewContext();

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
       <FlashcardBlock 
            flashcards={flashcards}
            loading={loading}
            error={err}
        />
  );
}