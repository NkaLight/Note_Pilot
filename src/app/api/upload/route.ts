// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import { summarizeWithOllama } from "@/lib/ollama";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const name = file.name || "Untitled";
    const isTxt =
      file.type.startsWith("text/") || name.toLowerCase().endsWith(".txt");
    if (!isTxt) {
      return NextResponse.json(
        { error: "Unsupported file type; please use .txt" },
        { status: 415 }
      );
    }

    const text = Buffer.from(await file.arrayBuffer()).toString("utf8").trim();
    if (!text) {
      return NextResponse.json({ error: "File is empty" }, { status: 422 });
    }

    const summary = await summarizeWithOllama(text);
    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Summarization failed" },
      { status: 500 }
    );
  }
}
