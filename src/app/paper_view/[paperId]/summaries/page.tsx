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

type SummaryItem = {
  header: string,
  text: string
}
export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);
  const {chosenLectureId, lectures, selectedLectureIds} = usePaperViewContext();
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedWith, setLastGeneratedWith] = useState<string>("");
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

  // Generate summaries automatically using selected uploads and chat context
  async function generateSummaries() {
    if (selectedLectureIds.length === 0) {
      setError("Please select at least one lecture from the PDFs page to generate summaries.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
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
        setError("No text content available from selected lectures. Please ensure PDFs have been uploaded and processed correctly.");
        return;
      }

      // Generate summaries using combined context via existing generateContent API
      const res = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: combinedText.slice(0, 15000) // Limit text size for API
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to generate summaries");

      if (Array.isArray(data.content)) {
        setSummaries(data.content);
        setLastGeneratedWith(`${selectedUploads.length} lecture${selectedUploads.length !== 1 ? 's' : ''} + chat history`);
      } else {
        console.error("Expected array format not returned");
        setSummaries([]);
        setError("Invalid response format from summary generation");
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong generating summaries");
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Auto-generate when selected lectures change
  useEffect(() => {
    if (selectedLectureIds.length > 0) {
      generateSummaries();
    } else {
      setSummaries([]);
      setError(null);
      setLastGeneratedWith("");
    }
  }, [selectedLectureIds.join(',')]); // Re-run when selection changes

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

        {/* Context info */}
        {selectedLectureIds.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-2">ℹ️</div>
              <div>
                <p className="text-yellow-800 font-medium">No lectures selected</p>
                <p className="text-yellow-700 text-sm">
                  Go to the PDFs page and select lectures to automatically generate summaries from your uploaded content.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-sm">
              📋 <strong>Auto-generating summaries</strong> from {selectedLectureIds.length} selected lecture{selectedLectureIds.length !== 1 ? 's' : ''} and chat history
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
            <span className="ml-3 text-gray-600">Generating summaries from your lectures and chat history...</span>
          </div>
        )}

        {/* Render summary results */}
        {summaries.length > 0 && !isLoading ? (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Generated {summaries.length} summary section{summaries.length !== 1 ? 's' : ''} from your selected content
            </div>
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
        ) : !isLoading && selectedLectureIds.length > 0 ? (
          <p className="text-gray-500 text-center py-8">No summaries generated yet.</p>
        ) : !isLoading ? (
          <p className="text-gray-500 text-center py-8">Select lectures from the PDFs page to start generating your summaries.</p>
        ) : null}
      </div>
    </div>
  );
}


