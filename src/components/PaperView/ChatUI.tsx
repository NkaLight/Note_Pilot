// src/components/DashBoard/ChatUI.tsx
/**
 * ChatUI component
 *
 * WHAT IT DOES
 * - Shows a chat-style interface with user + assistant messages.
 * - Sends user input to `/api/aiChat` and displays assistant replies.
 * - Adds a "Create Flashcards" button under each assistant reply.
 * - Persists chat messages to database linked to specific uploads.
 * - Loads existing chat history when upload/lecture is selected.
 *
 * PERSISTENT STORAGE
 * - Messages are stored in the chat_message table linked to uploadId
 * - Chat history is automatically loaded when uploadId changes
 * - All messages persist across page refreshes and sessions for each uploadId
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { usePaperViewContext } from "@/context/PaperViewContext";

type Message = { 
  role: "user" | "assistant"; 
  content: string;
  created_at?: string;
};

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const {chosenLectureId } = usePaperViewContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history when activeUploadIds changes
  useEffect(() => {
     if (!chosenLectureId) return;
     if(messages.length > 0) return;

     loadChatHistory(chosenLectureId);
  }, [chosenLectureId]); // Watch for changes in the array

  // Load existing chat messages for the selected upload
  const loadChatHistory = async (uploadId: number) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/chat?uploadId=${uploadId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const chatMessages = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at
        }));
        setMessages(chatMessages);
      } else if (response.status === 401) {
        setMessages(() => [
          { role: "assistant", content: "⚠️ Unauthorized." },
        ]);
      } else {
        setMessages([]);
      }
    } catch (error) {
      setMessages(() => [
          { role: "assistant", content: "⚠️ Something went wrong. Please try again later" },
        ]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !chosenLectureId) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBusy(true); 
    if(bottomRef.current){
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }

    try {
      const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ uploadId: chosenLectureId, content: input }),
     });
      
      const data = await res.json();
      const reply = data?.message?.content ?? "";
      const assistantMessage: Message = {
        role: "assistant", 
        content: reply || "⚠️ No reply received."
      };

      setMessages((prev) => [...prev, assistantMessage]);

    } catch(error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Something went wrong." },
        ]);
    } finally {
      setBusy(false);
    }
  };

  // Clear chat history for the current upload
  const clearChatHistory = async () => {
    if (!chosenLectureId) return;
    
    try {
      // Clear chat for the first upload (could be enhanced to clear all)
      const response = await fetch(`/api/chat?uploadId=${chosenLectureId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setMessages([]);
      } else {
        console.error('Failed to clear chat history');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header with context info and actions */}
      {/* {chosenLectureId && (
        <div className="mb-2 p-2 bg-blue-50 rounded-2xl border border-blue-200">
          <div className="flex justify-between items-center">
            <button
              onClick={clearChatHistory}
              className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
              title="Clear chat history"
            >
              Clear History
            </button>
          </div>
        </div>
      )} */}

      {/* Messages */}
      <div className="flex-1 rounded-3xl p-3 overflow-y-auto space-y-3" style={{background: "var(--card-bg)"}}>
        {loadingHistory && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-1">Loading chat history...</p>
          </div>
        )}
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
            </div>
          );
        })}
        {busy && <p className="text-sm text-black">Thinking…</p>}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="mt-3 p-1 rounded-full flex gap-2" style={{background:"var(--card-bg)"}}>
        <input
          className={`flex-1 rounded-xl 
            px-3 py-2 outline-none border-none bg-transparent dark:text-amber-50
          text-black placeholder:text-gray-500 dark:placeholder:text-zinc-400` }
          placeholder={"Ask about the lecture"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && handleSend()}
          disabled={busy}
        />
        <button
          onClick={handleSend}
          disabled={busy || !input.trim()}
          className={`rounded-full px-4 py-2 transition-colors bg-transparent text-transparent cursor-pointer`}
        >
          {busy ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
