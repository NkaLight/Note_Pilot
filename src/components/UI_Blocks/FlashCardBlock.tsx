"use client";
import { useState, useEffect } from "react";
 
type Flashcard = { question: string; answer: string };
 
type Props = {
    flashcards: Flashcard[];
    loading: boolean;
    error: string | null;
};

export function FlashcardBlock({flashcards, loading, error}:Props){
    const [flipIndex, setFlippedIndex] = useState<number|null>(null);

    useEffect(()=>{//Reset the flip index.
        setFlippedIndex(null);
    }, [flashcards]);

    const toggleFlip = (i) => setFlippedIndex(flipIndex === i ? null : i );
    
    if(loading){
        return (
            <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-1">Loading flashcards...</p>
          </div>
        );
    }
    if(error){
        return(
            <div className="flex items-center justify-center h-full">
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }
    if(flashcards.length === 0){
        return(
            <div className="flex items-center justify-center h-full">
                <p className="text-white/50 text-sm">No flashcards yet — select a lecture to get started.</p>
            </div>
        );
    }
    return(
        <div
            className="flex flex-col snap-y snap-mandatory gap-6 pt-6  w-full items-center bg-transparent"
        >
            {flashcards.map((card, i)=>{
                const isFlipped = flipIndex === i;
                return(
                    <div
                        key={i}
                        onClick={()=> toggleFlip(i)}
                        className="snap-center cursor-pointer border-none rounded-4xl shadow hover:shadow-lg transition-all text-black dark:text-white flex items-center justify-center text-center w-full max-w-4/4 aspect-square my-1"
                        style={{
                            flexShrink: 0,
                            background: "var(--card-bg)",
                            color: "var(--card-text)"
                        }}
                    >
                        {isFlipped ? card.answer : card.question}
                    </div>
                );
            })}
        </div>
    );
}