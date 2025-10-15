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

type GlossaryItem = {
  term: string;
  definition: string;
};

export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);
  const {chosenLectureId, lectures, selectedLectureIds} = usePaperViewContext();
  const params = useParams();
  const paperId = params?.paperId ? Number(params.paperId) : null;

  // Get the current selected lecture's upload ID
  const selectedLecture = lectures?.find(lecture => lecture.id === chosenLectureId);
  const uploadId = selectedLecture?.id || null;
  // Use selected lecture IDs as upload IDs for context
  const selectedUploadIds = selectedLectureIds;

  // Local UI state
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastGeneratedWith, setLastGeneratedWith] = useState<string>("");

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

  // Generate glossary automatically using selected uploads and chat context
  async function generateGlossary() {
    if (selectedLectureIds.length === 0) {
      setErr("Please select at least one lecture from the PDFs page to generate a glossary.");
      return;
    }
    
    setLoading(true);
    setErr(null);
    
    try {
      // Get all uploads for this paper to access text content
      const uploadsResponse = await fetch(`/api/uploads?paperId=${paperId}`);
      if (!uploadsResponse.ok) {
        throw new Error("Failed to fetch upload data");
      }
      
      const uploadsData = await uploadsResponse.json();
      if (!uploadsData.success) {
        throw new Error(uploadsData.error || "Failed to fetch uploads");
      }
      
      // Filter uploads to only selected ones and extract text content
      let combinedText = "";
      const selectedUploads = uploadsData.uploads.filter((upload: any) => 
        selectedLectureIds.includes(upload.upload_id)
      );
      
      for (const upload of selectedUploads) {
        if (upload.text_content && upload.text_content.trim()) {
          combinedText += `\n\n--- Content from ${upload.filename} ---\n${upload.text_content}`;
        }
      }
      
      // Get chat history for additional context
      try {
        const chatResponse = await fetch(`/api/chat?uploadIds=${selectedLectureIds.join(',')}`);
        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          if (chatData.messages && chatData.messages.length > 0) {
            const chatContext = chatData.messages
              .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
              .slice(-10) // Get last 10 messages for context
              .map((msg: any) => `${msg.role}: ${msg.content}`)
              .join('\n');
            
            if (chatContext.trim()) {
              combinedText += `\n\n--- Recent Chat History Context ---\n${chatContext}`;
            }
          }
        }
      } catch (e) {
        console.warn("Failed to fetch chat history for context:", e);
      }

      if (!combinedText.trim()) {
        setErr("No text content available from selected lectures. Please ensure PDFs have been uploaded and processed correctly.");
        return;
      }

      // Generate glossary using combined context
      const res = await fetch("/api/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: combinedText.slice(0, 15000) // Limit text size for API
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate glossary");

      setGlossary(data.glossary);
      setLastGeneratedWith(`${selectedUploads.length} lecture${selectedUploads.length !== 1 ? 's' : ''} + chat history`);
    } catch (e: any) {
      setErr(e.message || "Something went wrong generating the glossary");
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate when selected lectures change
  useEffect(() => {
    if (selectedLectureIds.length > 0) {
      generateGlossary();
    } else {
      setGlossary([]);
      setErr(null);
      setLastGeneratedWith("");
    }
  }, [selectedLectureIds.join(',')]); // Re-run when selection changes

  return (
    <div className="h-screen w-full flex gap-10 pl-10 pr-0">
      {/* Left: Chat */}
      <div
        className="rounded-3xl bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full pb-10 pt-14"
        style={{ width: chatWidth }}
      >
        <ChatUI uploadIds={selectedUploadIds} paperId={paperId} />
      </div>

      {/* Divider / Resizer */}
      <div
        onMouseDown={startResizing}
        className="w-1 cursor-col-resize opacity-30 bg-white hover:bg-gray-400 rounded relative"
      />

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
        {selectedLectureIds.length === 0 ? (
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
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              📚 <strong>Auto-generating glossary</strong> from {selectedLectureIds.length} selected lecture{selectedLectureIds.length !== 1 ? 's' : ''} and chat history
              {lastGeneratedWith && (
                <span className="block text-blue-600 mt-1">
                  Last generated from: {lastGeneratedWith}
                </span>
              )}
            </p>
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
    </div>
  );
}
