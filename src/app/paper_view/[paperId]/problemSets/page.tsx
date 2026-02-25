"use client";
/**
 * Problem Sets Page (client-side)
 *
 * WHAT IT DOES:
 * - Renders a layout (Chat | Problem Sets)
 * - Automatically generates problem sets from selected PDF uploads and AI chat context
 * - Provides a regenerate button for creating new iterations
 * - Uses context from lecture PDF uploads and AI chat history
 * - Persists questions and AI answers, but generates fresh feedback each time
 *
 * PERSISTENCE STRATEGY:
 * - Questions & AI Answers: Persistent (saved to database)
 * - User Answers: Persistent (saved locally for now, database later)
 * - Feedback & Scores: Temporary (generated fresh each time)
 */

import ProblemSet from "@/components/DashBoard/ProblemSet";
import { usePaperViewContext } from "@/context/PaperViewContext";
import StudyLayout from "@/components/DashBoard/StudyLayout"; 
import { useEffect, useRef, useState } from "react";

export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lectures, selectedLectureIds, chosenLectureId} = usePaperViewContext(); 


  // Load existing problem sets when selected lectures change
  async function loadExistingProblemSets() {
    if (chosenLectureId === null) {
      setQuestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/problemsets?uploadId=${chosenLectureId}`);
      const data = await response.json();
      
      console.log("DATA returned from endpoint: api/problemsets?uploadId", data);
      console.log(data.questions);
      if (data.success && data.questions && data.questions.length > 0) {
        const questionsWithUserAnswers = data.questions.map((q: any) => {
          return {
            ...q,
            userAnswer: ""
          };
        });
        
        setQuestions(questionsWithUserAnswers);
        setIsLoading(false);
        return questionsWithUserAnswers;
      }
    } catch (e) {
      console.error("Failed to load existing problem sets:", e);
      setError("Error generating exam style questions");
    } finally{
      setIsLoading(false);
    }
    return; // No existing problem sets found
  }

  // Generate new problem sets
  async function generateNewProblemSets() {
    if (!chosenLectureId === null) {
      setError("Please select at least one lecture from the PDFs page to generate problem sets.");
      return;
    }
  
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/problemsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mode: "generate", 
          uploadId: chosenLectureId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate problem sets");
      }

      if (data.questions && Array.isArray(data.questions)) {
        const questionsWithUserAnswers = data.questions.map((q: any) => {
          return {
            ...q,
            userAnswer: ""
          };
        });
        
        setQuestions(questionsWithUserAnswers);
      } else {
        setQuestions([]);
        setError("Invalid response format from problem set generation");
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong generating problem sets");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-load when selected lectures change
  useEffect(() => {
    if (chosenLectureId !== null) {
      loadExistingProblemSets().then((foundExisting) => {
        if (!foundExisting) {
          // No existing problem sets found, generate new ones
          generateNewProblemSets();
        }
      });
    }else{
      console.error("choseLectureId is null");
      setQuestions([]);
      setError(null);
    }
  }, [chosenLectureId]);

  // Manual regenerate function
  const handleRegenerate = () => {
    generateNewProblemSets();
  };

  // Save user answer (to localStorage for now)
  const saveUserAnswer = (questionId: string, answer: string) => {
    localStorage.setItem(`problemAnswer_${questionId}`, answer);
    
    // Update local state
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, userAnswer: answer } : q
    ));
  };

  return (
    <StudyLayout>
          {/* Middle: Problem Sets */}
          <div className=" rounded-3xl mb-5 mt-19 p-6 mr-10 bg-white/50 overflow-y-auto mt-5 flex-grow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Problem Sets</h2>
              {chosenLectureId && (
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? "Regenerating..." : "Regenerate Problems"}
                </button>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Generating problem sets from your lectures and chat history...</span>
              </div>
            )}

            {/* Render problem sets */}
            <div className="space-y-6">
              {questions.length > 0 && !isLoading ? (
                <>
                  <div className="text-sm text-gray-600 mb-4">
                    Generated {questions.length} question{questions.length !== 1 ? 's' : ''} from your selected content
                  </div>
                  {questions.map((q, idx) => (
                    <ProblemSet
                      question={q}
                      index={idx}
                      key={q.id || idx}
                      onAnswerChange={(answer) => saveUserAnswer(q.id, answer)}
                    />
                  ))}
                </>
              ) : !isLoading && selectedLectureIds.length > 0 && (
                <p className="text-gray-500 text-center py-8">No problem sets generated yet.</p>)}
            </div>
          </div>
        </StudyLayout>
  );
}
