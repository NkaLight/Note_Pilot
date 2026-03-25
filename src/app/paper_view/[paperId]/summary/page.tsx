"use client";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { StreamChunk } from "@/lib/utils/ai-gateway";
import { useEffect, useState } from "react";
import LoadingCircles from "@/components/LoadingCircles";
import ReactMarkdown from 'react-markdown';
import { Mermaid } from "@/components/Mermaid";

export default function DashboardPage() {
  const {chosenLectureId, selectedLectureIds} = usePaperViewContext();
  const [summaries, setSummaries] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateSummaries() {
    if (chosenLectureId === null) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setSummaries("");
    try {
      // Generate summaries using combined context via existing generateContent API
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          uploadId: chosenLectureId 
        }),
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");
      console.log(res.body);
      const reader = res.body.getReader();
      const textDec = new TextDecoder();
      // eslint-disable-next-line no-constant-condition
      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        try{
          const chunk = textDec.decode(value, {stream: true});
          console.log("RAW: ", chunk);
          const lines = chunk.split("\n").filter((l)=>l.startsWith("data: "));
          for(const line of lines){
            const payload = line.slice(6);
            if(payload === "[DONE]")break;
            try{
              const parse:StreamChunk = JSON.parse(payload);
              if(parse.type === "error"){
                setSummaries("Something went wrong.");
                setError(parse.message);
              }else if(parse.type === "delta"){
                console.log(parse.text);
                setSummaries(prevState => prevState + parse.text);
              }
            }catch{
              //Do nothing
            }finally{
              setIsLoading(false);
            }
          }
        }catch{
          setError("Something wrong happened");
          setSummaries("");
        }finally{
          setIsLoading(false);
        }
      }
    }catch{
       setError("Something wrong happened");
        setSummaries("");
    }finally{
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
        const res = await fetch(`/api/summary?uploadId=${chosenLectureId}`);
        const data = await res.json();
        console.log(data);
        if(data.content){
          setSummaries(data.content);
          setIsLoading(false);
        }else{
          await generateSummaries();
        }
      }catch(err){
        setError("Failed to get summaries");
      }finally{
        setIsLoading(false);
      }
    };
    syncSummaries().catch(() => setError("Failed to sync summaries"));
  }, [chosenLectureId]); // Re-run when selection changes

  return (
    <>
      {/* Middle: Summaries */}
      <div className=" rounded-3xl mb-5 mt-19 p-6 bg-white/50 mr-10 overflow-y-auto mt-5 flex-grow" style={{background: "var(--card-bg)"}}>
        <div className="flex justify-between items-center mb-4">
          {chosenLectureId  && (
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
        {summaries && (
            <ReactMarkdown
              components={{
                code({className, children}){
                  if(className === "language-mermaid"){
                    return<Mermaid chart={String(children).trim()} />;
                  }else{
                    return <code className="className">{children}</code>;
                  }
                }
              }}
            >
              {summaries}
            </ReactMarkdown>
        )}
        {isLoading && (<LoadingCircles className={'w-5'} />)}
      </div>
    </>
  );
}