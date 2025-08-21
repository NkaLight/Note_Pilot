// src/app/components/Dashboard/ChatUI.tsx
"use client";

import { useState } from "react";

export default function ChatUI({ onDone }: { onDone: () => void }) {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  const handleSummarize = async () => {
    if (!input.trim()) return;
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        body: JSON.stringify({ text: input, title: title || null }),
      });
      const data = await res.json();
      if (data?.summary) {
        setResult(data.summary);
      } else {
        setResult("No summary returned.");
      }
    } catch (e) {
      setResult("Failed to summarize.");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setBusy(true);
    try {
      await fetch("/api/summaries", {
        method: "POST",
        body: JSON.stringify({ title: title || null, summaryText: result }),
      });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-[min(90vw,700px)] space-y-4">
      <h2 className="text-xl font-semibold">Create a Summary</h2>
      <input
        className="w-full border rounded-xl px-3 py-2"
        placeholder="Optional title (e.g., COSC343 Week 4)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full min-h-[160px] border rounded-xl p-3"
        placeholder="Paste lecture notes or text to summarize…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSummarize}
          disabled={busy || !input.trim()}
          className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-50"
        >
          {busy ? "Summarizing…" : "Summarize"}
        </button>
        <button
          onClick={handleSave}
          disabled={busy || !result}
          className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {result && (
        <div className="border rounded-2xl p-4 bg-gray-50">
          <h3 className="font-medium mb-2">Summary</h3>
          <p className="whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}
