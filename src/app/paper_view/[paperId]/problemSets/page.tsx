"use client";

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
  const {chosenLectureId, lectures, selectedLectureIds} = usePaperViewContext(); 
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    if (!chosenLectureId) return;
    setIsLoading(true);
    setQuestions([]); // clear previous

    fetch("/api/problemsets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "generate", lectureId: chosenLectureId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions || []);
      })
      .catch((err) => console.error("Failed to generate problems:", err))
      .finally(() => setIsLoading(false));
  }, [chosenLectureId]);

  
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
          <div className=" rounded-3xl mb-5 mt-19 p-6 mr-10 bg-white/50 overflow-y-auto mt-5 flex-grow">
            <h2 className="text-xl font-semibold mb-4 text-black">Problem Sets</h2>
            <div className="space-y-6">
              {questions.length == 0 && <p className="text-gray-500">{isLoading? "Generating..." :"No questions available for this lecture yet."}</p>}
              {questions.map((q, idx) => (
                <ProblemSet
                  question={q}
                  index={idx}
                  key={idx}
                />
              ))}
            </div>
          </div>
        </div>
  );
}
