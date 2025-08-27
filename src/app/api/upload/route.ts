import { NextResponse } from "next/server";
import { pdf_processing } from "@/lib/pdf_processing";
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
    const isPdf =
      file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");

    let text = "";

    if (isTxt) {
      text = Buffer.from(await file.arrayBuffer()).toString("utf8").trim();
    } else if (isPdf) {
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await pdf_processing(buffer)
    } else {
      return NextResponse.json(
        { error: "Unsupported file type; please use .txt or .pdf" },
        { status: 415 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 422 }
      );
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
