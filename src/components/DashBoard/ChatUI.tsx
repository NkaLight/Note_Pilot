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
 * - All messages persist across page refreshes and sessions
 */
"use client";

import { useEffect, useState } from "react";

type Message = { 
  role: "user" | "assistant"; 
  content: string;
  message_id?: number;
  created_at?: string;
};

export default function ChatUI({
  onMakeFlashcards,
  paperId,
  uploadId,
  uploadIds,
}: {
  onMakeFlashcards?: (text: string) => void;
  paperId?: number;
  uploadId?: number;
  uploadIds?: number[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Use uploadIds if provided, otherwise fallback to single uploadId
  const activeUploadIds = uploadIds && uploadIds.length > 0 ? uploadIds : (uploadId ? [uploadId] : []);
  const hasActiveUploads = activeUploadIds.length > 0;

  // Load chat history when activeUploadIds changes
  useEffect(() => {
    if (activeUploadIds.length > 0) {
      // For multiple uploads, we'll load the combined chat history
      // or just load from the first one for simplicity
      loadChatHistory(activeUploadIds[0]);
    } else {
      setMessages([]); // Clear messages if no upload selected
    }
  }, [activeUploadIds.join(',')]); // Watch for changes in the array

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
          message_id: msg.message_id,
          created_at: msg.created_at
        }));
        setMessages(chatMessages);
      } else if (response.status === 401) {
        console.log('Not authorized to load chat history');
        setMessages([]);
      } else {
        console.log('No chat history found for this upload');
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Save a message to the database
  const saveMessage = async (message: Message, uploadId: number) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          uploadId,
          role: message.role,
          content: message.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.message;
      } else {
        console.error('Failed to save message to database');
        return null;
      }
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setBusy(true);

    // Save user message to database if we have active uploads
    if (activeUploadIds.length > 0) {
      // Save to the first upload for now, could be enhanced to save to all
      await saveMessage(userMessage, activeUploadIds[0]);
    }

    try {
      const requestBody: any = { message: userMessage.content };
      
      // Add context if available - use multiple uploadIds if available
      if (activeUploadIds.length > 0) {
        requestBody.uploadIds = activeUploadIds;
      } else if (paperId) {
        requestBody.paperId = paperId;
      }

      const res = await fetch("/api/aiChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });
      
      const data = await res.json();
      const reply = (data?.message ?? "").trim();

      const assistantMessage: Message = {
        role: "assistant", 
        content: reply || "⚠️ No reply received."
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to database if we have active uploads
      if (activeUploadIds.length > 0) {
        await saveMessage(assistantMessage, activeUploadIds[0]);
      }
      if (uploadId && reply) {
        await saveMessage(assistantMessage, uploadId);
      }
    } catch {
      const errorMessage: Message = {
        role: "assistant", 
        content: "⚠️ Something went wrong."
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      // Save error message to database if we have active uploads
      if (activeUploadIds.length > 0) {
        await saveMessage(errorMessage, activeUploadIds[0]);
      }
    } finally {
      setBusy(false);
    }
  };

  // Clear chat history for the current upload
  const clearChatHistory = async () => {
    if (activeUploadIds.length === 0) return;
    
    try {
      // Clear chat for the first upload (could be enhanced to clear all)
      const response = await fetch(`/api/chat?uploadId=${activeUploadIds[0]}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setMessages([]);
        console.log('Chat history cleared successfully');
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
      {hasActiveUploads && (
        <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">
              💬 Chat with {activeUploadIds.length === 1 ? 'selected lecture' : `${activeUploadIds.length} selected lectures`}
            </span>
            <button
              onClick={clearChatHistory}
              className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
              title="Clear chat history"
            >
              Clear History
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 rounded-3xl p-3 bg-white/50 overflow-y-auto space-y-3">
        {loadingHistory && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-1">Loading chat history...</p>
          </div>
        )}
        
        {!loadingHistory && messages.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            {hasActiveUploads 
              ? "No chat history yet. Start a conversation about the selected lectures!" 
              : "Select lectures to start chatting with context."
            }
          </p>
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

              {/* New: show a small button beside assistant replies */}
              {isAssistant && m.content && onMakeFlashcards && (
                <div className="mr-auto">
                  <button
                    onClick={() => onMakeFlashcards(m.content)}
                    className="text-sm px-2 py-1 rounded-md border hover:bg-gray-80"
                    title="Create flashcards from this reply"
                  >
                    Create Flashcards
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {busy && <p className="text-sm text-black">Thinking…</p>}
      </div>

      {/* Composer */}
      <div className="mt-3 p-0 rounded-full bg-black/5 flex gap-2">
        <input
          className={`flex-1 rounded-xl px-3 py-2 ${
            !hasActiveUploads 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'text-black'
          }`}
          placeholder={hasActiveUploads 
            ? `Ask about ${activeUploadIds.length === 1 ? 'this lecture' : 'these lectures'}...` 
            : "Select lectures to start chatting..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !busy && hasActiveUploads && handleSend()}
          disabled={busy || !hasActiveUploads}
        />
        <button
          onClick={handleSend}
          disabled={busy || !input.trim() || !hasActiveUploads}
          className={`rounded-full px-4 py-2 transition-colors ${
            busy || !input.trim() || !hasActiveUploads
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'hover:bg-gray-50 text-black'
          }`}
        >
          {busy ? 'Thinking...' : 'Send'}
        </button>
      </div>
      
      {!hasActiveUploads && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Select lectures from the PDF page to enable contextual AI chat
        </p>
      )}
    </div>
  );
}
