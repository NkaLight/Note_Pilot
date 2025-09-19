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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data?.message) {
        const botMessage: Message = { role: "assistant", content: data.message };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error("No reply received");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Something went wrong." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">

      {/* Chat messages box */}
      <div className="flex-1 rounded-3xl p-3 bg-white/50 overflow-y-auto space-y-3">
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

      {/* Input box (separate container at bottom) */}
      <div className="mt-3 p-0 rounded-full bg-black/5 flex gap-2">
        <input
          className="flex-1  rounded-xl px-3 py-2 text-black"
          placeholder="Ask something about your notes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={busy || !input.trim()}
          className="rounded-full px-4 py-2 hover:bg-gray-50 disabled:opacity-50 text-black"
        >
          Send
        </button>
      </div>
    </div>
  );
}
