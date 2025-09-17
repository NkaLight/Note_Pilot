"use client";

import { useState } from "react";

export default function Upload({ onSaved }: { onSaved: () => void }) {
  const [folderInput, setFolderInput] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderFiles, setFolderFiles] = useState<Record<string, string[]>>({});
  const [busyFolder, setBusyFolder] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleFolderKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && folderInput.trim()) {
      e.preventDefault();
      const newFolder = folderInput.trim();
      setFolders((prev) => [...prev, newFolder]);
      setFolderFiles((prev) => ({ ...prev, [newFolder]: [] }));
      setFolderInput("");
      setShowFolderInput(false);
    }
  }

  async function handleFileUpload(folder: string, file: File) {
    setBusyFolder(folder);
    setError("");

    try {
      const form = new FormData();
      form.append("folder", folder);
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setFolderFiles((prev) => ({
          ...prev,
          [folder]: [...(prev[folder] || []), file.name],
        }));
        onSaved();
      }
    } catch {
      setError("Upload failed");
    } finally {
      setBusyFolder(null);
    }
  }

  return (
    <div className="bg-white/0 text-black rounded-2xl p-4">
      <h2 className="font-semibold mb-4">Files</h2>
      <hr className="my-3 border-t border-black/30 -mx-6" />

      {/* Folder creation */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="folder" className="text-sm font-medium">
            Folders
          </label>
          <button
            type="button"
            onClick={() => setShowFolderInput((prev) => !prev)}
            className="text-xl font-bold text-black hover:text-gray-600"
            aria-label="Add Folder"
          >
            +
          </button>
        </div>

        {showFolderInput && (
          <input
            id="folder"
            type="text"
            placeholder="e.g. COSC203"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            onKeyDown={handleFolderKeyDown}
            className="w-full rounded-xl border border-black px-3 py-2 text-black"
            autoFocus
          />
        )}

        {/* Folder list with upload buttons */}
        <ul className="mt-4 space-y-4 text-sm text-black">
          {folders.map((folder) => (
            <li key={folder} className="border border-black/0 rounded-xl ml-0 p-0 bg-white/0">
              <div className="font-semibold mb-2">{folder}</div>

                            {/* Uploaded files */}
                            {folderFiles[folder]?.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {folderFiles[folder].map((filename, idx) => (
                    <li key={idx} className="px-2 py-1 bg-white/0 rounded border border-black/0">
                      {filename}
                    </li>
                  ))}
                </ul>
              )}

              {/* File input for this folder */}
              <label
                htmlFor={`file-${folder}`}
                className="inline-block cursor-pointer rounded-xl border border-black/0 bg-white/0 px-3 py-0 text-black"
              >
                Upload
              </label>
              <input
                id={`file-${folder}`}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(folder, file);
                }}
              />

              {/* Loading indicator */}
              {busyFolder === folder && (
                <p className="text-xs text-gray-500 mt-2">Uploading…</p>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 border border-red-500 bg-red-100 text-red-700 p-3 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}
