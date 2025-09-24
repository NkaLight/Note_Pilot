// src/app/ai/dashboard/page.tsx
"use client";

import { useContext, useEffect, useState } from "react";
import ChatUI from "@/components/DashBoard/ChatUI";
import Summary from "@/components/DashBoard/Summary";
import Upload from "@/components/DashBoard/Upload";


type SummaryItem = { id: string; title: string | null; summaryText: string; createdAt: string };

export default function DashboardPage() {
  const [items, setItems] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  async function fetchSummaries() {
    setLoading(true);
    try {
      const res = await fetch("/api/summaries", { cache: "no-store" });
      const data = await res.json();
      setItems(data?.summaries ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSummaries(); }, []);

  return (
    <div className="space-y-8 mt-16">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Upload flow */}
      <Upload onSaved={fetchSummaries} />

      {/* Manual paste → summarize flow (optional) */}
      <div className="border rounded-2xl p-6 bg-white text-black shadow">
        <ChatUI/>
      </div>

      {/* Saved summaries */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading summaries…</p>
      ) : items.length === 0 ? (
        <div className="border rounded-2xl p-6 text-gray-600 bg-gray-50">
          No summaries yet. Upload notes or paste text above.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((s) => <Summary key={s.id} summary={s} />)}
        </div>
      )}
    </div>
  );
}
