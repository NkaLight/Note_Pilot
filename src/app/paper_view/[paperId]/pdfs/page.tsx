"use client";

import ChatUI from "@/components/DashBoard/ChatUI";
import { usePaperViewContext } from "@/context/PaperViewContext";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type PDFUpload = {
  upload_id: number;
  filename: string;
  uploaded_at: string;
  text_content?: string;
}

export default function PDFsPage() {
  // Chat width starts at 50% of viewport
  const [chatWidth, setChatWidth] = useState("50%");
  const isResizing = useRef(false);
  const { chosenLectureId, lectures, selectedLectureIds, setSelectedLectureIds, setLectures } = usePaperViewContext();

  // Toggle selection of a lecture
  const toggleLectureSelection = (lectureId: number) => {
    setSelectedLectureIds(prev => 
      prev.includes(lectureId) 
        ? prev.filter(id => id !== lectureId)
        : [...prev, lectureId]
    );
  };

  // Select all lectures
  const selectAllLectures = () => {
    setSelectedLectureIds(lectures.map(lecture => lecture.id));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedLectureIds([]);
  };

  // Get upload IDs for selected lectures
  const selectedUploadIds = selectedLectureIds;
  const [pdfs, setPdfs] = useState<PDFUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const paperId = params?.paperId ? Number(params.paperId) : null;

  // Get the current selected lecture's upload ID
  const selectedLecture = lectures?.find(lecture => lecture.id === chosenLectureId);
  const uploadId = selectedLecture?.id || null;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  };

  const resize = (e: MouseEvent) => {
    if (!isResizing.current) return;

    // Minimum 200px, maximum viewport - 300px (so pdfs don't collapse too much)
    const newWidth = Math.min(Math.max(e.clientX, 200), window.innerWidth - 300);
    setChatWidth(`${newWidth}px`);
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  };

  // Fetch PDFs for this paper
  useEffect(() => {
    if (!paperId) return;
    
    setIsLoading(true);
    setError(null);
    
    fetch(`/api/uploads?paperId=${paperId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const uploads = data.uploads || [];
          setPdfs(uploads);
          
          // Sync with lectures context - convert PDFs to lecture format
          const lecturesFromPDFs = uploads.map((pdf: PDFUpload) => ({
            id: pdf.upload_id,
            title: pdf.filename,
            createdAt: new Date(pdf.uploaded_at)
          }));
          setLectures(lecturesFromPDFs);
        } else {
          setError(data.error || "Failed to load PDFs");
        }
      })
      .catch(err => {
        console.error("Failed to fetch PDFs:", err);
        setError("Failed to load PDFs");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [paperId, setLectures]);

  // Delete a PDF
  const handleDeletePDF = async (uploadId: number) => {
    if (!confirm("Are you sure you want to delete this PDF?")) return;
    
    try {
      const res = await fetch(`/api/uploads/${uploadId}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (data.success) {
        const updatedPdfs = pdfs.filter(pdf => pdf.upload_id !== uploadId);
        setPdfs(updatedPdfs);
        
        // Sync with lectures context - convert remaining PDFs to lecture format
        const lecturesFromPDFs = updatedPdfs.map((pdf: PDFUpload) => ({
          id: pdf.upload_id,
          title: pdf.filename,
          createdAt: new Date(pdf.uploaded_at)
        }));
        setLectures(lecturesFromPDFs);
        
        // Remove from selected lectures if it was selected
        setSelectedLectureIds(prev => prev.filter(id => id !== uploadId));
      } else {
        setError(data.error || "Failed to delete PDF");
      }
    } catch (err) {
      console.error("Failed to delete PDF:", err);
      setError("Failed to delete PDF");
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!paperId) return;
    
    setError(null);
    setUploadMessage(null);
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('paperId', paperId.toString());
    formData.append('lectureTitle', file.name.replace(/\.[^/.]+$/, "")); // Remove extension

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadMessage(`File "${file.name}" uploaded successfully! ${data.textLength > 0 ? `Extracted ${data.textLength} characters of text.` : 'No text content extracted - may be image-only PDF.'}`);
        await refreshPDFList(); // Refresh the list
        
        // Clear success message after 5 seconds
        setTimeout(() => setUploadMessage(null), 5000);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Refresh PDF list
  const refreshPDFList = async () => {
    if (!paperId) return;
    
    try {
      const response = await fetch(`/api/uploads?paperId=${paperId}`);
      const data = await response.json();
      
      if (data.success) {
        const uploads = data.uploads || [];
        setPdfs(uploads);
        
        // Sync with lectures context - convert PDFs to lecture format
        const lecturesFromPDFs = uploads.map((pdf: PDFUpload) => ({
          id: pdf.upload_id,
          title: pdf.filename,
          createdAt: new Date(pdf.uploaded_at)
        }));
        setLectures(lecturesFromPDFs);
      } else {
        console.error('Failed to refresh PDFs:', data.error);
      }
    } catch (err) {
      console.error('Failed to refresh PDFs:', err);
    }
  };

  // Handle successful upload (refresh the list)
  const handleUploadSuccess = async () => {
    await refreshPDFList();
  };

  return (
    <div className="h-screen w-full flex gap-10 pl-10 pr-0">
      {/* Left: Chat */}
      <div className="rounded-3xl bg-white/0 overflow-y-auto mt-5 flex-shrink-0 h-full pb-10 pt-14"
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

      {/* Middle: PDF Management */}
      <div className="rounded-3xl mb-5 mt-19 p-6 bg-white/50 overflow-y-auto mt-5 flex-grow">
        
        {/* Lecture Selection Section */}
        <div className="mb-8 p-4 bg-white rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-black">Select Lectures for AI Context</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllLectures}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                disabled={lectures.length === 0}
              >
                Select All
              </button>
              <button
                onClick={clearAllSelections}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                disabled={selectedLectureIds.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>
          
          {lectures.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No lectures uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-40 overflow-y-auto">
              {lectures.map((lecture) => (
                <label 
                  key={lecture.id} 
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedLectureIds.includes(lecture.id)
                      ? 'bg-blue-50 border-blue-300 text-blue-900'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedLectureIds.includes(lecture.id)}
                    onChange={() => toggleLectureSelection(lecture.id)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{lecture.title}</div>
                    <div className="text-xs text-gray-500">
                      {lecture.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <div className="mt-3 text-sm text-gray-600">
            {selectedLectureIds.length > 0 ? (
              <span className="text-blue-600 font-medium">
                ✓ {selectedLectureIds.length} lecture{selectedLectureIds.length !== 1 ? 's' : ''} selected for AI context
              </span>
            ) : (
              <span>Select lectures to provide context for AI chat</span>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-black">PDF Management</h2>
          <button
            onClick={() => refreshPDFList()}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Upload Area */}
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="text-center">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && paperId) {
                  handleFileUpload(file);
                }
                // Reset input so same file can be uploaded again
                e.target.value = '';
              }}
              disabled={isUploading}
            />
            <label
              htmlFor="pdf-upload"
              className={`inline-block px-6 py-3 rounded-lg cursor-pointer transition-colors ${
                isUploading 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload PDF/TXT File'}
            </label>
            <p className="mt-2 text-sm text-gray-600">
              Select PDF or TXT files to upload. Text will be extracted for AI processing.
            </p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {uploadMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex justify-between items-center">
              <span>{uploadMessage}</span>
              <button 
                onClick={() => setUploadMessage(null)}
                className="text-green-700 hover:text-green-900"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <p className="text-gray-500">Loading PDFs...</p>
        ) : pdfs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No PDFs uploaded for this paper yet.</p>
            <p className="text-gray-400 text-sm">Use the upload area above to add your first PDF.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Uploaded Files ({pdfs.length})</h3>
            </div>
            {pdfs.map((pdf) => (
              <div key={pdf.upload_id} className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1 text-black">{pdf.filename}</h3>
                    <p className="text-sm text-gray-600">
                      Uploaded: {new Date(pdf.uploaded_at).toLocaleDateString()} at {new Date(pdf.uploaded_at).toLocaleTimeString()}
                    </p>
                    <div className="flex items-center mt-2 gap-2">
                      {pdf.text_content && pdf.text_content.trim() ? (
                        <>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Text Available
                          </span>
                          <span className="text-sm text-gray-600">
                            {pdf.text_content.length} characters extracted
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠ No Text Extracted
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeletePDF(pdf.upload_id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
