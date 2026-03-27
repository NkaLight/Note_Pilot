"use client";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { StreamChunk } from "@/lib/utils/ai-gateway";
import { useEffect, useState, useRef} from "react";
import ReactMarkdown from 'react-markdown';

export default function SummaryPage() {
  const {chosenLectureId} = usePaperViewContext();
  const [summaries, setSummaries] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement|null>(null);

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
                setSummaries(prevState => prevState + parse.text);
                bottomRef.current.scrollIntoView();
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
        if(data.summary){
          setSummaries(data.summary.text_content);
          setIsLoading(false);
          bottomRef.current.scrollIntoView();
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
    <div style={{background: "var(--card-bg)", color:"var(--card-txt)"}} className="rounded-4xl p-3">
        <div onClick={()=>generateSummaries()} className="max-w-min ml-auto  cursor-pointer">REGENERATE</div>
        {summaries &&
          (<div className="prose prose-theme max-w-none dark:prose-invert">
            <ReactMarkdown>
                {summaries}
            </ReactMarkdown>
            <div ref={bottomRef} />
            </div>
          )
        }
        {isLoading && (<div ref={bottomRef} className="text-sm text-black">Thinking…</div>)}
    </div>
  );
}