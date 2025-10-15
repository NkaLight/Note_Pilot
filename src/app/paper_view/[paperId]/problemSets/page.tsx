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

import ChatUI from "@/components/DashBoard/ChatUI";
import ProblemSet from "@/components/DashBoard/ProblemSet";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedWith, setLastGeneratedWith] = useState<string>("");
  const [lastLoadedUploadIds, setLastLoadedUploadIds] = useState<string>("");
  const {chosenLectureId, lectures, selectedLectureIds} = usePaperViewContext(); 
  const params = useParams();
  const paperId = params?.paperId ? Number(params.paperId) : null;

  // Use selected lecture IDs as upload IDs for context
  const selectedUploadIds = selectedLectureIds;

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

  // Load existing problem sets when selected lectures change
  async function loadExistingProblemSets() {
    if (selectedLectureIds.length === 0) {
      setQuestions([]);
      setLastGeneratedWith("");
      return;
    }

    try {
      const response = await fetch(`/api/problemsets?uploadIds=${selectedLectureIds.join(',')}`);
      const data = await response.json();
      
      if (data.success && data.questions && data.questions.length > 0) {
        // Load user answers from localStorage
        const questionsWithUserAnswers = data.questions.map((q: any) => {
          const savedAnswer = localStorage.getItem(`problemAnswer_${q.id}`);
          return {
            ...q,
            userAnswer: savedAnswer || ""
          };
        });
        
        setQuestions(questionsWithUserAnswers);
        setLastGeneratedWith(`${selectedLectureIds.length} lecture${selectedLectureIds.length !== 1 ? 's' : ''} (loaded from cache)`);
        setLastLoadedUploadIds(selectedLectureIds.join(','));
        return true; // Found existing problem sets
      }
    } catch (e) {
      console.error("Failed to load existing problem sets:", e);
    }
    
    return false; // No existing problem sets found
  }

  // Generate new problem sets
  async function generateNewProblemSets() {
    if (selectedLectureIds.length === 0) {
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
          uploadIds: selectedLectureIds 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate problem sets");
      }

      if (data.questions && Array.isArray(data.questions)) {
        // Load any existing user answers from localStorage
        const questionsWithUserAnswers = data.questions.map((q: any) => {
          const savedAnswer = localStorage.getItem(`problemAnswer_${q.id}`);
          return {
            ...q,
            userAnswer: savedAnswer || ""
          };
        });
        
        setQuestions(questionsWithUserAnswers);
        setLastGeneratedWith(`${selectedLectureIds.length} lecture${selectedLectureIds.length !== 1 ? 's' : ''} (newly generated)`);
        setLastLoadedUploadIds(selectedLectureIds.join(','));
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
    const currentSelection = selectedLectureIds.join(',');
    
    if (selectedLectureIds.length > 0 && currentSelection !== lastLoadedUploadIds) {
      loadExistingProblemSets().then((foundExisting) => {
        if (!foundExisting) {
          // No existing problem sets found, generate new ones
          generateNewProblemSets();
        }
      });
    } else if (selectedLectureIds.length === 0) {
      setQuestions([]);
      setError(null);
      setLastGeneratedWith("");
      setLastLoadedUploadIds("");
    }
  }, [selectedLectureIds.join(',')]);

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
    <div className=" h-screen w-full flex gap-10 pl-10 pr-0">
          {/* Left: Chat */}
        <div className=" rounded-3xl bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full pb-10 pt-14"
          style={{ width: chatWidth }}
          >
          <ChatUI uploadIds={selectedUploadIds} paperId={paperId} />
          </div>
    
          {/* Divider / Resizer */}
          <div
            onMouseDown={startResizing}
            className="w-1 cursor-col-resize opacity-30 bg-white hover:bg-gray-400 rounded relative"
          >
          </div>
    
          {/* Middle: Problem Sets */}
          <div className=" rounded-3xl mb-5 mt-19 p-6 mr-10 bg-white/50 overflow-y-auto mt-5 flex-grow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-black">Problem Sets</h2>
              {selectedLectureIds.length > 0 && (
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? "Regenerating..." : "Regenerate Problems"}
                </button>
              )}
            </div>

            {/* Context info */}
            {selectedLectureIds.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-yellow-600 mr-2">ℹ️</div>
                  <div>
                    <p className="text-yellow-800 font-medium">No lectures selected</p>
                    <p className="text-yellow-700 text-sm">
                      Go to the PDFs page and select lectures to automatically generate problem sets from your uploaded content.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-blue-800 text-sm">
                  📝 <strong>Auto-generating problem sets</strong> from {selectedLectureIds.length} selected lecture{selectedLectureIds.length !== 1 ? 's' : ''} and chat history
                  {lastGeneratedWith && (
                    <span className="block text-blue-600 mt-1">
                      Last generated from: {lastGeneratedWith}
                    </span>
                  )}
                </p>
              </div>
            )}

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
              ) : !isLoading && selectedLectureIds.length > 0 ? (
                <p className="text-gray-500 text-center py-8">No problem sets generated yet.</p>
              ) : !isLoading ? (
                <p className="text-gray-500 text-center py-8">Select lectures from the PDFs page to start generating your problem sets.</p>
              ) : null}
            </div>
          </div>
        </div>
  );
}
