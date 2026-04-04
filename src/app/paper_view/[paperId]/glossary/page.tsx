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

import { usePaperViewContext } from "@/context/PaperViewContext";
import { useEffect, useState, useCallback} from "react";
import { RefreshCcw } from "lucide-react";

type GlossaryItem = {
  term: string;
  definition: string;
};

export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const {chosenLectureId} = usePaperViewContext();

  // Local UI state
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Generate glossary automatically using selected uploads and chat context
const generateGlossary = useCallback(async (regenerate: boolean) => {
    if (chosenLectureId === null) {
      setErr("Please select at least one lecture from the PDFs page to generate a glossary.");
      return;
    }
    setLoading(true);
    setErr(null);
    
    try {
      //Get all the glossary data for the chosenLecturedId
      const res = await fetch(`/api/glossary?uploadId=${chosenLectureId}`);

      let data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate glossary");
      if(!data.glossary.length || regenerate){
        const resp = await fetch(`/api/glossary?uploadId=${chosenLectureId}`, {
          method:"POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadId: chosenLectureId
          })
        });
        data = await resp.json();
      }
      setGlossary(data.glossary);
      setLoading(false);
    } catch (e: any) {
      setErr(e.message || "Something went wrong generating the glossary");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [chosenLectureId]);

  // Auto-generate when selected lectures change
  useEffect(() => {
    if (chosenLectureId) {
      generateGlossary(false);
    } else {
      setGlossary([]);
      setErr(null);
    }
  }, [chosenLectureId, generateGlossary]); // chosenLectureId changes

  return (
    <>
      {/* Middle: Glossary */}
      <div className="rounded-4xl   p-3 bg-white/50 mr-10 overflow-y-auto  flex-grow dark:text-white text-black" style={{background: "var(--card-bg)"}}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-white text-black">Glossary</h2>
          {chosenLectureId && (
            <div className=" font-serif flex max-w-min ml-auto gap-1  cursor-pointer mr-5 opacity-10 hover:opacity-100 duration-300 ease-in-out transition-opacity "  onClick={()=>generateGlossary(true)}>Regenerate <RefreshCcw size={"1.5em"}/></div>
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
            <span className="ml-3 text-gray-600">Generating glossary from your lecture...</span>
          </div>
        )}

        {/* Render glossary results */}
        <div className="space-y-4">
          {glossary.length > 0 && !loading && (
            <>
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
          )}
        </div>
      </div>
    </>
  );
}

