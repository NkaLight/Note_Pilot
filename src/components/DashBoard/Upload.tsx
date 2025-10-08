'use client';

import { useState } from "react";
import { usePaperViewContext } from "@/context/PaperViewContext"
import { useParams } from "next/navigation";

type Lecture = {
  id: number;
  title: string;
  createdAt: Date;
};

export default function Upload({ onSaved }: { onSaved: () => void }) {
  // State for the new lecture title
  const [lectureTitle, setLectureTitle] = useState("");
  // State for managing the upload process
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const {lectures, setChosenLectureId, setLectures, chosenLectureId} = usePaperViewContext();

  const paperId = useParams().paperId?.toString();

  // Handler for when a file is selected
  async function handleFileUpload(file: File) {
    if (!lectureTitle.trim()) {
      setError("Please enter a title for the new lecture first.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const form = new FormData();
      // Pass the user-provided title and the file
      form.append("lectureTitle", lectureTitle.trim()); 
      form.append("file", file);
      form.append("paperId", paperId?paperId:"");

      // 1. API Call
      console.log("Uploading file:", file.text);
      console.log("File name:", file.name);
      console.log("File size:", file.size);
      console.log("File type:", file.type);
      console.log("PaperId:", paperId);
      console.log("LectureTitle:", lectureTitle);
      const res = await fetch("/api/upload_v2", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed. Please try again.");
      } else {
        // 2. Success - Reset form and notify parent

        // Trigger the parent component (WorkspaceClient) to refresh its lecture list
        const newLecture : Lecture = {id: lectures.length, title: lectureTitle, createdAt: new Date()};
        setLectures(prevState => [...prevState, newLecture]);
        setLectureTitle("");
      }
    } catch {
      setError("Network or server error during upload.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <ul className="space-y-2">
        {lectures.map((lecture) => (
            <li 
                key={lecture.id} 
                onClick={() => setChosenLectureId(lecture.id)} // Pass the ID on click
                className={`p-2 rounded-lg cursor-pointer transition-colors text-sm text-black ${
                    lecture.id === chosenLectureId 
                        ? 'bg-blue-100 border-blue-500 font-semibold' 
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
            >
                <div className="font-medium truncate block">{lecture.title}</div>
                <div className="text-xs text-gray-500">
                    {lecture.createdAt.toLocaleDateString()}
                </div>
            </li>
        ))}
      </ul>
      <div className="text-black p-0 my-4">
        {/* Input for Lecture Title */}
        <input
          id="lecture-title"
          type="text"
          placeholder="Lecture Title (e.g., Intro to Algorithms)"
          value={lectureTitle}
          onChange={(e) => setLectureTitle(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black mb-3 focus:ring-blue-500 focus:border-blue-500"
          disabled={isUploading}
        />
        
        {/* File Upload Button (linked to hidden input) */}
        <label
          htmlFor="file-upload-input"
          className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            isUploading || !lectureTitle.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
          }`}
        >
          {isUploading ? 'Uploading...' : 'Upload Lecture File (.txt, .pdf, etc.)'}
        </label>
        
        {/* Hidden File Input */}
        <input
          id="file-upload-input"
          type="file"
          // Update accepted file types as needed
          accept=".pdf" 
          className="hidden"
          disabled={isUploading || !lectureTitle.trim()}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file);
              e.target.value = ''; // Clear input for next selection
            }
          }}
        />

        {/* Error message */}
        {error && (
          <div className="mt-3 border border-red-500 bg-red-100 text-red-700 p-2 rounded-md text-sm">
            Error: {error}
          </div>
        )}
        
        <hr className="my-4 border-t border-gray-300" />
      </div>
    </div>
  );
}