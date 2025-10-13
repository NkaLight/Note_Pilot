"use client";

import ChatUI from "@/components/DashBoard/ChatUI";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

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
          <div className=" rounded-3xl mb-5 mt-19 p-6 bg-white/50 overflow-y-auto mt-5 flex-grow">
            <h2 className="text-xl font-semibold mb-4 text-black">Study Guide</h2>
            {/* TODO: render summaries here */}
          </div>
        </div>
  );
}
