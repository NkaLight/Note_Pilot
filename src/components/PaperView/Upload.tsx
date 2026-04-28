"use client";

import { useState, useRef } from "react";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { useParams } from "next/navigation";
import { UploadIcon } from "../Icons/FIleIcon";
import LoadingCircles from "../LoadingCircles";
import {CheckIcon, EditIcon, TrashIcon, XIcon } from "lucide-react";

type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};

export default function Upload({onClickEvent, onDoneEvent}:{onClickEvent:()=>void; onDoneEvent:()=>void}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState<number | boolean>(false);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number|null>(null);
  const {lectures, setChosenLectureId, setLectures, chosenLectureId, code} = usePaperViewContext();
  const fileInputRef = useRef(null);
  const paperId = useParams().paperId?.toString();
  // Handler for when a file is selected
  async function handleFileUpload(file: File) {
    setIsUploading(true);
    setError("");
    try {
      const form = new FormData();
      // Pass the paperId and file_content 
      form.append("paperId", paperId);

      const response = await fetch("/api/upload/init", {
        method: "POST", 
        body: form
      });
      if(!response.ok){
        console.error("Error starting uploading initialization");
        return;
      }
      const {uploadUrl,uploadId } = await response.json();
      console.error(uploadUrl);
      console.error("UploadId:", uploadId);
      const uploadRes = await fetch(uploadUrl, {
        method:"PUT",
        body: file 
      });
      if(!uploadRes.ok){
        console.error("Error uploading file to AWS");
        return;
      }

      //Generate Lecture title
      form.append("uploadId", uploadId);
      const res = await fetch("/api/upload/complete", {
        method:"POST", 
        body: form
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed. Please try again.");
      } else {
        // 2. Success - Reset form and notify parent
        const lectureTitle = await data.title;
        const newLecture : Lecture = {id: uploadId, title: lectureTitle, createdAt: new Date()};
        setLectures(prevState => [...prevState, newLecture]);
      }
    } catch {
      setError("Network or server error during upload.");
    } finally {
      onDoneEvent();
      setIsUploading(false);
    }
  }

  async function handleDelete(uploadId:number, paperId:string){
    setIsLoading(uploadId);
    setError("");
    const oldList = [...lectures];
    try{
      setLectures(prevState =>
        prevState.filter(lecture =>
          lecture.id !== uploadId
        )
      );

      const form = new FormData();
      form.append("paperId", paperId);
      form.append("uploadId", String(uploadId));

      const res = await fetch("/api/upload_v2", {method:"DELETE", body:form });
      if(!res.ok) throw new Error();
    }catch{
      setError("Error updating deleting the lecture");
      setLectures(oldList);
      setIsLoading(false);
    }
  };

  async function handleFileUpdate(newName:string, uploadId:number, paperId:string){
    setIsLoading(uploadId);
    setError("");
    try{
      const form = new FormData();
      form.append("paperId", paperId);
      form.append("uploadId", String(uploadId));
      form.append("newFileName", newName);
      const oldLecture  = lectures.filter(lectures => lectures.id === uploadId);
      setLectures(prevState =>
        prevState.map(lecture =>
          lecture.id === uploadId ? 
          {...lecture, title: newName} :
          lecture
        )
      );
      const res = await fetch("/api/upload_v2", {method:"PUT", body:form});
      if(!res.ok){
        setError("Failed to update your lecture name");
        //Reset the state
        setLectures(prevState => 
          prevState.map(lecture => 
            lecture.id === uploadId ? 
              {...lecture, title:oldLecture[0].title}:
              lecture
          )
        );
      }
    }catch{
       setError("Error updating the lecture");
    }finally{
      setIsLoading(false);
      onDoneEvent();
    }
  }

  return (
    <div>
      <ul className="space-y-2">
        <p className="--var(card-text) pb-0 mb-0 ml-0.5"> {code}</p>
        <hr className="pt-0 mt-0 w-20"/>
        {lectures.map((lecture) => (
            <li 
                key={lecture.id} 
                className={`pl-2 rounded-lg transition-colors text-sm text-black dark:text-white ${
                    lecture.id === chosenLectureId 
                        ? "bg-transparent font-semibold underline" 
                        : "bg-transparent"
                }`}
            >
              {editingId === lecture.id ? 
                (
                  <input
                    autoFocus
                    data-testid={`edit-lecture-input-${lecture.id}`}
                    className="font-medium text-sm border-b border-gray-400 bg-transparent outline-none w-full"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => setEditingId(null)} // cancel on blur
                    onKeyDown={async(e) => {
                        if (e.key === "Enter") {
                            // call your rename handler here
                            await handleFileUpdate(editingTitle, lecture.id, paperId);
                            setEditingId(null);
                        }
                        if (e.key === "Escape") setEditingId(null);
                    }}
                />
                ) :  
                (
                  <>
                    <div className="font-medium truncate cursor-pointer block hover:underline" onClick={()=>setChosenLectureId(lecture.id)}>{lecture.title}</div>
                    <div className="text-xs text-gray-500 flex gap-1">
                        {lecture.createdAt.toLocaleDateString()}
                        <span><EditIcon 
                                className="w-3 cursor-pointer hover:text-black hover:dark:text-white" 
                                data-testid={`edit-lecture-btn-${lecture.id}`}
                                onClick={()=>{
                                  onClickEvent(); 
                                  setEditingTitle(lecture.title);
                                  setEditingId(lecture.id);
                                  }}/></span>

                        <span><TrashIcon 
                                className="w-3 cursor-pointer hover:text-black hover:dark:text-white"
                                data-testid={`delete-lecture-btn-${lecture.id}`}
                                onClick={()=>{
                                  onClickEvent();
                                  setDeletingId(lecture.id);
                                }}
                                /></span>
                        <span>{isLoading === lecture.id && <LoadingCircles className={"w-5 m-0.5 p-0 ml-1 dark:text-white "}/>}</span>
                        <span>{deletingId === lecture.id && <CheckIcon className={"w-3 cursor-pointer hover:text-black hover:dark:text-white"} data-testid={`confirm-delete-lecture-btn-${lecture.id}`} onClick={()=>{
                          onClickEvent();
                          handleDelete(lecture.id, paperId);
                        }}/>}</span>
                        <span>{deletingId === lecture.id && <XIcon className={"w-3 cursor-pointer hover:text-black hover:dark:text-white"} onClick={()=> {setDeletingId(null); onDoneEvent();}}/>}</span>
                    </div>
                  </>
                )
              }
                
            </li>
        ))}

      </ul>
      <div 
        className="flex mt-1 ml-4 size-3 cursor-pointer dark:text-white text-black"
        onClick={() => {
          if(!isUploading){
            onClickEvent(); 
            window.addEventListener("focus", ()=>{
              if(!fileInputRef.current?.files?.length && isUploading){
                onDoneEvent();
              }
            }, {once:true});
            fileInputRef.current?.click();
          }
        }}

          >Upload <span>{isUploading ? <LoadingCircles className={"w-5 m-0.5 p-0 ml-1 dark:text-white "}/> :<UploadIcon className="h-4 p-0 m-0 mt-1 ml-1 dark:text-white text-black" />}</span></div>
      <div className="text-black p-0 my-4">
        {/* Input for Lecture Title */}
        {/* Hidden File Input */}
        <input
          id="file-upload-input"
          type="file"
          ref={fileInputRef}
          // Update accepted file types as needed
          accept=".pdf" 
          className="hidden"
          disabled={isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file);
              e.target.value = ""; // Clear input for next selection
            }
          }}
        />

        {/* Error message */}
        {error && (
          <div className="mt-3 border border-red-500 bg-red-100 text-red-700 p-2 rounded-md text-sm">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}