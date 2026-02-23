"use client";
/**
 * Glossary Page (client-side)
 *
 * WHAT IT DOES:
 * - Renders a layout similar to other pages (Chat | Glossary)
 * - Automatically generates glossary from selected PDF uploads and AI chat context
 * - Provides a regenerate button for creating new iterations
 * - Uses context from lecture PDF uploads and AI chat history
 *
 * AUTOMATIC GENERATION:
 * - Uses selected lecture uploads as context for glossary generation
 * - Combines PDF text content and chat history for comprehensive glossary
 * - Regenerates when selected lectures change or when user clicks regenerate
 */

import ChatUI from "@/components/DashBoard/ChatUI";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StudyLayout from "@/components/DashBoard/StudyLayout";

type GlossaryItem = {
  term: string;
  definition: string;
};

export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const {chosenLectureId, lectures, selectedLectureIds} = usePaperViewContext();
  const params = useParams();
  const paperId = params?.paperId ? Number(params.paperId) : null;


  // Local UI state
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);


  // Generate glossary automatically using selected uploads and chat context
  async function generateGlossary() {
    if (chosenLectureId === null) {
      setErr("Please select at least one lecture from the PDFs page to generate a glossary.");
      return;
    }
    setLoading(true);
    setErr(null);
    
    try {
      //Get all the glossary data for the chosenLecturedId
      const res = await fetch(`api/glossary?upload_id=${chosenLectureId}`, {
        method: "GET", 
        headers:{"Content-Type":"application/json"}, 
      });

      const data = await res.json();
      console.log("Returned data: ", data);
      if (!res.ok) throw new Error(data?.error || "Failed to generate glossary");
      console.log("Response data: ", data);
      setGlossary(data.glossary);
      setLoading(false);
    } catch (e: any) {
      setErr(e.message || "Something went wrong generating the glossary");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }
  console.log("Glossary:" ,glossary);

  // Auto-generate when selected lectures change
  useEffect(() => {
    if (selectedLectureIds.length > 0) {
      generateGlossary();
    } else {
      setGlossary([]);
      setErr(null);
    }
  }, [chosenLectureId]); // chosenLectureId changes

  return (
    <StudyLayout>
      {/* Middle: Glossary */}
      <div className="rounded-3xl mb-5 mt-19 p-6 bg-white/50 mr-10 overflow-y-auto mt-5 flex-grow text-black">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-black">Glossary</h2>
          {selectedLectureIds.length > 0 && (
            <button
              onClick={generateGlossary}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {loading ? "Regenerating..." : "Regenerate Glossary"}
            </button>
          )}
        </div>

        {/* Context info */}
        {chosenLectureId === null && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-2">ℹ️</div>
              <div>
                <p className="text-yellow-800 font-medium">No lectures selected</p>
                <p className="text-yellow-700 text-sm">
                  Go to the PDFs page and select lectures to automatically generate a glossary from your uploaded content.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Error display */}
        {err && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{err}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Generating glossary from your lectures and chat history...</span>
          </div>
        )}

        {/* Render glossary results */}
        <div className="space-y-4">
          {glossary.length > 0 && !loading ? (
            <>
              <div className="text-sm text-gray-600 mb-4">
                Found {glossary.length} term{glossary.length !== 1 ? 's' : ''} in your selected content
              </div>
              {glossary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 rounded-lg p-4 shadow-md hover:shadow-lg transition-all border border-gray-200"
                >
                  <p className="font-semibold text-lg text-blue-700 mb-2">{item.term}</p>
                  <p className="text-gray-800 leading-relaxed">{item.definition}</p>
                </div>
              ))}
            </>
          ) : !loading && selectedLectureIds.length > 0 ? (
            <p className="text-gray-500 text-center py-8">No glossary terms generated yet.</p>
          ) : !loading ? (
            <p className="text-gray-500 text-center py-8">Select lectures from the PDFs page to start generating your glossary.</p>
          ) : null}
        </div>
      </div>
    </StudyLayout>
  );
}
