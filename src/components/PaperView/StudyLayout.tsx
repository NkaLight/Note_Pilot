"use client";
import React, { useState, useRef } from "react";
import ChatUI from "@/components/PaperView/ChatUI";
import Upload from "@/components/PaperView/Upload";
import {FileIconPlus} from "@/components/Icons/FIleIcon";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./PdfView"), { ssr: false });

interface StudyLayoutProps {
  children: React.ReactNode; // Generated content such as flashcards etc.
  onMakeAction?: (text: string) => void; // e.g., makeFlashcardsFrom
  uploadIds?: number[];
  paperId?: number | null;
}

export default function StudyLayout({ children }: StudyLayoutProps) {
    const [chatWidth, setChatWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const uploadContainerRef = useRef<HTMLDivElement>(null);
    const [showPDF, setShowPDF] = useState<boolean>(false);
    const [pdfUrl, setPdfUrl] = useState<string|null>(null);
    const [loadingPdf, setIsLoadingPdf] = useState<boolean>(false);

    const onPointerMove = (e:React.PointerEvent<HTMLDivElement>) =>{
        if(!isResizing || !containerRef.current) return null;
        const containerRect = containerRef.current.getBoundingClientRect();
        //offsets the gap and pl, currently 80.
        const offset = 80;
        const newWidth = e.clientX - containerRect.left - offset;
        // 3. Simple boundaries
        if (newWidth > 400 && newWidth < window.innerWidth * 0.7) {
            setChatWidth(newWidth);
        };
    };
    const onPointerUp = (e:React.PointerEvent<HTMLDivElement>)=>{
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsResizing(false);
    };
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const divider = e.currentTarget;
        // 1. Lock the pointer to this divider
        divider.setPointerCapture(e.pointerId);
        setIsResizing(true);
    };
    const keepUploadUIVisible = ()=>{
      if (!uploadContainerRef.current) return;
      uploadContainerRef.current.style.width = "13vw";
      uploadContainerRef.current.style.opacity = "1";
    };
    const releaseUploadUI = ()=>{
      if (!uploadContainerRef.current) return;
      uploadContainerRef.current.style.width = "";
      uploadContainerRef.current.style.opacity = "";
    };

    const renderPdf = async (uploadId:number)=>{
      //api/upload_v2/[id] GET
      setIsLoadingPdf(true);
      try{
        const res = await fetch(`/api/upload_v2/${uploadId}`, {
          method:"GET"
        });
        const data = await res.json();
        const {downloadUrl} = data;
        setPdfUrl(downloadUrl);
        setShowPDF(true);
        }catch(error){
          console.error(error);
        }finally{
          setIsLoadingPdf(false);
        }
    };
    const stopRenderPdf = ()=>{
      setShowPDF(false);
      setPdfUrl(null);
    };

  return (
    <div ref={containerRef} className="h-screen w-full flex pl-10 gap-10 pr-0 overflow-hidden">
      {/* (1) Chat Panel */}
      <div style={{ width: `${chatWidth}px` }} className="flex-shrink-0 h-full pb-10 pt-14">
        <ChatUI />
      </div>

      {/* (2) The Resizer */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`w-5 p-0 m-0 h-full cursor-col-resize bg-transparent touch-none transition-colors ${
          isResizing ? "bg-blue-500" : "hover:bg-blue-500/40 bg-transparent"
        }`}
      />

      {/* (3) Middle Content (The Unique Part) */}
      <main className="flex-grow overflow-y-auto mt-19 mb-5 pr-10 relative">
        <div className="w-full h-full">
          {children}
        </div>
        {loadingPdf && (
          <div className="absolute inset-0 z-20 bg-white dark:bg-gray-900">
            <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600 mt-1">Loading Pdf...</p>
            </div>
          </div>
        )}
        {showPDF &&(
          <div className="absolute inset-0 z-20 bg-white dark:bg-gray-900">
            <PdfViewer signedUrl={pdfUrl}/>
          </div>
        )}
      </main>
      {/* (4) Upload Panel */}
      <aside className="group relative">
        <div ref={uploadContainerRef} 
            className="border p-2 bg-transparent backdrop-blur-sm rounded-md w-0 opacity-5 
            group-hover:w-[13vw] group-hover:opacity-100 transition-all duration-800 h-full overflow-y-auto
            ">
          <div className="flex mt-4 text-white">FILES: <span><FileIconPlus className="h-4 p-0 m-0 mt-1 ml-1 text-white"/></span></div>
          <hr className="mb-8 mt-5"/>
          <Upload onClickEvent={()=> keepUploadUIVisible()} onDoneEvent={()=> releaseUploadUI()} renderPdf={renderPdf} stopRenderPdf={stopRenderPdf}/>
        </div>
      </aside>
    </div>
  );
}