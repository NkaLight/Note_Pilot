"use client";
/**
 * Summaries Page (client-side)
 *
 * WHAT IT DOES:
 * - Renders a layout (Chat | Summaries)
 * - Automatically generates summaries from selected PDF uploads and AI chat context
 * - Provides a regenerate button for creating new iterations
 * - Uses context from lecture PDF uploads and AI chat history
 *
 * AUTOMATIC GENERATION:
 * - Uses selected lecture uploads as context for summary generation
 * - Combines PDF text content and chat history for comprehensive summaries
 * - Regenerates when selected lectures change or when user clicks regenerate
 */

import ChatUI from "@/components/DashBoard/ChatUI";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StudyLayout from "@/components/DashBoard/StudyLayout";

type SummaryItem = {
  header: string,
  text: string
}
export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const {chosenLectureId, lectures, selectedLectureIds} = usePaperViewContext();
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate summaries automatically using selected uploads and chat context
  async function generateSummaries() {
    if (chosenLectureId === null) {
      setError("Please select at least one lecture from the PDFs page to generate summaries.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate summaries using combined context via existing generateContent API
      const res = await fetch("/api/generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          uploadId: chosenLectureId 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate summaries");

      if (Array.isArray(data.content)) {
        setSummaries(data.content);
      } else {
        console.error("Expected array format not returned");
        setSummaries([]);
        setError("Invalid response format from summary generation");
      }
    } catch (e: any) {
      setError("Error generating summaries");
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-generate when selected lectures change
  useEffect(() => {
    const syncSummaries = async()=>{
      if(!chosenLectureId)return;
      setIsLoading(true);
      setError(null);
      try{
        const res = await fetch(`/api/generateContent?uploadId=${chosenLectureId}`);
        const data = await res.json();
        if(res.ok && data.content && data.content.length > 0){
          const mappedSummaries  = (data.content as SummaryItem[]).map((fc)=>({
            header:fc.header,
            text:fc.text
          }));
          setSummaries(mappedSummaries);
        }else{
          await generateSummaries();
        }
      }catch(err){
        console.error("Sync error", error);
        setError("Failed to get summaries");
      }finally{
        setIsLoading(false);
      }
    };
    syncSummaries();
  }, [chosenLectureId]); // Re-run when selection changes

  return (
    <StudyLayout>
      {/* Middle: Summaries */}
      <div className=" rounded-3xl mb-5 mt-19 p-6 bg-white/50 mr-10 overflow-y-auto mt-5 flex-grow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Summaries</h2>
          {selectedLectureIds.length > 0 && (
            <button
              onClick={generateSummaries}
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Regenerating..." : "Regenerate Summaries"}
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
            <span className="ml-3 text-gray-600">Generating summaries from your lectures.</span>
          </div>
        )}

        {/* Render summary results */}
        {summaries.length > 0 && !isLoading ? (
          <>
            <div className="space-y-6">
              {summaries.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-2 text-black">{item.header}</h3>
                  <p
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                </div>
              ))}
            </div>
          </>
        ) : !isLoading && selectedLectureIds.length > 0 && (
          <p className="text-gray-500 text-center py-8">No summaries generated yet.</p>
        )}
      </div>
    </StudyLayout>
  );
}


