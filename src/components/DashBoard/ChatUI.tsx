// src/components/DashBoard/ChatUI.tsx
/**
 * ChatUI component
 *
 * WHAT IT DOES
 * - Shows a chat-style interface with user + assistant messages.
 * - Sends user input to `/api/aiChat` and displays assistant replies.
 * - Adds a 📇 "Create Flashcards" button under each assistant reply.
 *   Clicking this calls `onMakeFlashcards` with the assistant's text.
 *
 * CURRENT LIMITATION
 * - Messages are held only in React state → disappear on page refresh.
 * - Future work: persist messages in DB (e.g. prisma.chat_message table).
 */
"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

//  New: accept a callback prop the page provides
export default function ChatUI({
  onMakeFlashcards,
}: {
  onMakeFlashcards?: (text: string) => void;
}) {
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
        body: JSON.stringify({ message: userMessage.content }),
      });
      const data = await res.json();
      const reply = (data?.message ?? "").trim();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply || "⚠️ No reply received." },
      ]);
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
    <div className="w-full h-full flex-col ">
      {/* Messages */}
      <div className="flex-1 rounded-3xl p-3 bg-white/50 overflow-y-auto space-y-3 h-5/6">
        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";
          return (
            <div key={i} className={`space-y-2`}>
              <div
                className={`p-3 rounded-xl max-w-[80%] text-black ${
                  isAssistant
                    ? "bg-gray-100 mr-auto text-left"
                    : "bg-blue-100 ml-auto text-right"
                }`}
              >
                {m.content}
              </div>

              {/* New: show a small button beside assistant replies */}
              {isAssistant && m.content && onMakeFlashcards && (
                <div className="mr-auto">
                  <button
                    onClick={() => onMakeFlashcards(m.content)}
                    className="text-sm px-2 py-1 rounded-md border hover:bg-gray-80"
                    title="Create flashcards from this reply"
                  >
                    📇 Create Flashcards
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {busy && <p className="text-sm text-black">Thinking…</p>}
      </div>

      {/* Composer */}
      <div className="mt-3 flex items-center gap-2 border border-black-300 rounded-full focus-within:border-black transition-colors">
        <input
          className="flex-1 rounded-full px-3 py-2 text-black outline-none bg-grey"
          placeholder="Ask something about your notes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={busy || !input.trim()}
          className="rounded-full px-4 py-2 hover:bg-gray-50 disabled:opacity-50 text-black cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}
