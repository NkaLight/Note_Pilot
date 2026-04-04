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
import { useSearchParams } from "next/navigation";
import { RefreshCcw } from "lucide-react";

type Flashcard = { question: string; answer: string };
type ApiFlashcard = { question_front: string; answer_back: string };

export default function FlashcardsPage() {
  // Flashcards state
   const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { chosenLectureId, setCode } = usePaperViewContext();
  const paperCode = useSearchParams().get("paper_code");
  setCode(paperCode);

  
  async function makeFlashcardsFromUpload(uploadId: number) {
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
    }finally{
      setLoading(false);
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
    <>
      {chosenLectureId && <div className=" font-serif flex max-w-min ml-auto gap-1  cursor-pointer mr-5 opacity-10 hover:opacity-100 duration-300 ease-in-out transition-opacity "  onClick={()=>makeFlashcardsFromUpload(chosenLectureId)}>Regenerate <RefreshCcw size={"1.5em"}/></div>}
      <FlashcardBlock 
            flashcards={flashcards}
            loading={loading}
            error={err}
        />
    </>
  );
}