// src/components/Dashboard/Upload.tsx
"use client";
import { useState } from "react";

export default function Upload({ onSaved }: { onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setBusy(true);
    setError("");
    setSummary("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Upload failed");
      else {
        setSummary(data.summary || "");
        onSaved();
      }
    } catch {
      setError("Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-black bg-white text-black rounded-2xl p-4">
      <h2 className="font-semibold mb-2">Upload (.txt only)</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="file-upload"
            className="inline-block cursor-pointer rounded-xl border border-black bg-white px-4 py-2 text-black hover:bg-gray-50"
          >
            {file ? file.name : "Choose File"}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <button
          type="submit"
          disabled={!file || busy}
          className="px-4 py-2 border border-black rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? "Processing…" : "Upload & Summarize"}
        </button>
      </form>

      {error && (
        <div className="mt-3 border border-red-500 bg-red-100 text-red-700 p-3 rounded-xl">
          {error}
        </div>
      )}

      {summary && (
        <article className="border border-black bg-white text-black rounded-2xl p-4 mt-3">
          <p className="text-sm whitespace-pre-wrap">{summary}</p>
        </article>
      )}
    </div>
  );
}
