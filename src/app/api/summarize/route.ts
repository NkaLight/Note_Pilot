import { NextResponse } from "next/server";
import { summarizeWithOllama } from "@/lib/ollama"; // 
export const runtime = "nodejs";


/**
 * An API route that summarizes text using the Ollama API.
 * May be redundant now that we use OpenRouter for summarization, but keeping it around just in case.
 * @param req the incoming request containing text to summarize and optional model
 * @returns  the summarized text or an error message
 */
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
