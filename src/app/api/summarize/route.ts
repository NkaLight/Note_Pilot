// src/app/api/summarize/route.ts
import { NextResponse } from "next/server";
import { summarizeWithOllama } from "@/lib/ollama"; // 
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text, model } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: "Missing text" }, { status: 400 });
    const summary = await summarizeWithOllama(text, model);
    return NextResponse.json({ summary });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Summarization failed" }, { status: 500 });
  }
}
