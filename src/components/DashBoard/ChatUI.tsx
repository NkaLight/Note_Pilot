// src/app/components/Dashboard/ChatUI.tsx
"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/aiChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }), // ✅ send just the latest message
      });
  
      const data = await res.json();
  
      if (data?.message) {
        const botMessage: Message = { role: "assistant", content: data.message };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error("No reply received");
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Something went wrong." },
      ]);
    } finally {
      setBusy(false);
    }
  };
  
  return (
    <div className="relative w-full h-full flex flex-col">
    {/* Chat Header */}
    <h2 className="text-xl font-semibold text-black mb-2">Chat with your notes</h2>
  
    {/* Chat messages */}
    <div className="flex-1 border rounded-2xl p-2 bg-white overflow-y-auto space-y-3">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`p-3 rounded-xl max-w-[80%] text-black ${
            m.role === "user"
              ? "bg-blue-100 ml-auto text-right"
              : "bg-gray-100 mr-auto text-left"
          }`}
        >
          {m.content}
        </div>
      ))}
      {busy && <p className="text-sm text-black">Thinking…</p>}
    </div>
  
    {/* Input box pinned to bottom */}
    <div className="absolute bottom-2 left-0 w-full p-4 bg-white border-t border-gray-300 flex gap-2">
      <input
        className="flex-1 border rounded-xl px-3 py-2 text-black"
        placeholder="Ask something about your notes..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button
        onClick={handleSend}
        disabled={busy || !input.trim()}
        className="rounded-xl px-4 py-2 border hover:bg-gray-50 disabled:opacity-50 text-black"
      >
        Send
      </button>
    </div>
  </div>
  
  );
}
