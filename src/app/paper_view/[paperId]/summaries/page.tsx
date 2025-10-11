"use client";

import { useState, useRef, useEffect } from "react";
import ChatUI from "@/components/DashBoard/ChatUI";
import Summary from "@/components/DashBoard/Summary";
import Upload from "@/components/DashBoard/Upload";
import { usePaperViewContext } from "@/context/PaperViewContext";

type SummaryItem = {
  header: string,
  text: string
}
export default function DashboardPage() {
  // Chat width starts at 50% of viewport
  const [chatWidth, setChatWidth] = useState(() => `${window.innerWidth / 2}px`);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);
  const {chosenLectureId} = usePaperViewContext();
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  

  const startResizing = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    isResizing.current = true;
    startXRef.current = e.clientX;

    if (chatRef.current) {
      const currentWidth = chatRef.current.getBoundingClientRect().width;
      startWidthRef.current = currentWidth;
    } else {
      // Fallback to state value parsed as pixels
      startWidthRef.current = parseFloat(chatWidth);
    }


    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing.current) return;

    const delta = e.clientX - startXRef.current;
    const startWidth = startWidthRef.current;
    // Minimum 200px, maximum viewport - 300px (so summaries don't collapse too much)
    const newWidth = Math.max(
      200, // Minimum width
      Math.min(
        startWidth + delta, 
        window.innerWidth - 400 // Maximum width (viewport - 300px)
      )
    );

    console.log("Windowe inner.width: ", window.innerWidth);
    console.log("new chatWidth: ", newWidth);
    setChatWidth(`${newWidth}px`);
  };

  const stopResizing = () => {
    isResizing.current = false;

    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";

    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };


    useEffect(() => { 
    if (!chosenLectureId) return;
    console.log("Called api/generateConent/")
    setIsLoading(true);
    fetch("/api/generateContent....", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lectureId: chosenLectureId, contentType: "summaries" })
    })
    .then(res => res.json())
    .then(data => {
      if(Array.isArray(data.content)){
        setSummaries(data.content);
        setIsLoading(false)
      }else{
        console.error("expected format not returned");
        setSummaries([]);
      };
    })
    .catch((err) => {
        console.error("Failed to fetch summaries:", err);
        setSummaries([]);
    });
  }, [chosenLectureId]);

  return (
    <div className="h-screen w-full flex gap-8 pl-10 pr-0">
      {/* Left: Chat */}
    <div className="h-full w-full rounded-3xl bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full pb-10 pt-14"
      style={{ width: chatWidth }}
      >
      <ChatUI />
      </div>

      {/* Divider / Resizer */}
      <div
        onMouseDown={startResizing}
        className={`w-8 cursor-col-resize opacity-30 flex-shrink-0 bg-inherit hover:bg-gray-400 rounded relative transition-colors duration-300`}
      >
      </div>

      {/* Middle: Summaries */}
      <div className="h-4/5 rounded-3xl mb-5 mt-19 p-6 bg-white/50 overflow-y-auto mt-5 flex-grow w-full ">
        <h2 className="text-xl font-semibold mb-4 text-black">Summaries</h2>
        {summaries.length === 0 ? (
          <p className="text-gray-500">{isLoading? "Generating..." :"No summaries available for this lecture yet."}</p>
        ) : (
          <div className="space-y-6">
            {summaries.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-black">{item.header}</h3>
                <p
                  className="text-gray-800"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Upload */}
      <div className="group">
        {/* Invisible hover zone (triggers panel to slide in) */}
        <div className="absolute left-0 top-0 h-full w-3 bg-transparent z-20 cursor-ew-resize" />

        {/* Upload Panel */}
        <div
          className="
            h-full border border border-white/30 p-2 bg-white/30 pb-0 backdrop-blur-md rounded-md shadow-md overflow-y-auto w-[0] flex-shrink-0 
            overflow-y-auto transition-all duration-300 
            w-0 opacity-0 
            group-hover:w-[12vw] group-hover:opacity-100
          "
        >
          <h4 className="mt-10 mb-5">Lectures: </h4>
          <Upload onSaved={() => {}} />
        </div>
      </div>
    </div>
  );
}


