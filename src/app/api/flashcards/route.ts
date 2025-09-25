// src/app/api/flashcards/route.ts
/**
 * Flashcard generation API (server-only, Next.js App Router)
 *
 * WHAT IT DOES
 * - Validates the caller is authenticated (via getSessionUser).
 * - Validates input with Zod: either `text` OR `uploadId` must be provided.
 * - If `text` is provided, sends it to the LLM via OpenRouter to generate flashcards.
 * - If `uploadId` is provided (and no `text`), loads source text from DB summary table.
 * - Parses/validates the LLM response (must be a JSON array of {question_front, answer_back}).
 * - Optionally persists the flashcards if `uploadId` was given.
 * - Had issues with Supabase before pushing, so will need more testing wether the data is good enough.
 *
 * INPUT (JSON)
 *  {
 *    "text"?: string,
 *    "uploadId"?: number
 *  }
 *  (exactly one of the two must be present)
 *
 * OUTPUT (JSON)
 *  200: { flashcards: Array<{question_front, answer_back}>, savedSet: { ... } | null }
 *  4xx/5xx: { error: string, detail?: string }
 *
 * ENV VARS
 *  - NVIDIA_AI_API or OPENROUTER_API_KEY : the OpenRouter API key (Bearer).
 *  - APP_URL                            : recommended by OpenRouter for referer; defaults to http://localhost:3000
 *
 * NOTES
 * - This route requires an authenticated session (401 otherwise).
 * - The LLM is instructed to return ONLY a raw JSON array (no prose, no fences).
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FlashcardsReq, FlashcardArray } from "@/lib/zod_schemas/flashcards";

// OpenRouter chat completions endpoint
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// System instruction to keep generations compact & strictly JSON
const SYSTEM_PROMPT = `
You generate concise, factual study flashcards.
Return ONLY a JSON array of objects with keys "question_front" and "answer_back".
No prose, no markdown, no code fences—JSON array ONLY.
Max 1–2 sentences per field. Avoid duplicates.
`;

// Simple health check / smoke test endpoint
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/flashcards" });
}

export async function POST(req: Request) {
  try {
    //  Require a logged-in user
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    //  Validate body with Zod
    const body = await req.json();
    const parsed = FlashcardsReq.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    // Resolve source text: prefer `text`; fallback to DB via `uploadId`
    let sourceText = parsed.data.text ?? "";
    const uploadId = parsed.data.uploadId ?? null;

    if (!sourceText && uploadId) {
      // If client passed an uploadId, load canonical text (e.g., stored summary) from DB
      const summary = await prisma.summary.findUnique({
        where: { upload_id: uploadId },
        select: { text_data: true },
      });
      if (!summary?.text_data) {
        return NextResponse.json({ error: "No text found for given uploadId." }, { status: 404 });
      }
      sourceText = summary.text_data;
    }

    // Build a precise user prompt that restates the JSON-only shape
    const userPrompt = `
Generate flashcards from the following content.
Output JSON ONLY as:
[
  {"question_front": "...", "answer_back": "..."},
  ...
]
Content:
"""${sourceText.slice(0, 12000)}"""
`.trim();

    // Call OpenRouter with timeout/abort protection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        // Use whichever env var you have for the AI_API
        "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`,
        // Recommended by OpenRouter (helps identify traffic)
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Note Pilot",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-9b-v2:free",
        temperature: 0.2,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    }).finally(() => clearTimeout(timeout));

    //  Robust upstream error/ctype handling
    const ctype = resp.headers.get("content-type") || "";
    if (!resp.ok) {
      const errText = ctype.includes("application/json") ? JSON.stringify(await resp.json()) : await resp.text();
      return NextResponse.json(
        { error: `Upstream error: ${resp.status} ${resp.statusText}`, detail: errText.slice(0, 800) },
        { status: 502 }
      );
    }
    if (!ctype.includes("application/json")) {
      const text = await resp.text();
      return NextResponse.json({ error: "Non-JSON response from provider", detail: text.slice(0, 800) }, { status: 502 });
    }

    //  Parse provider JSON, hardening against accidental ``` fences
    const data = await resp.json();
    const raw = (data?.choices?.[0]?.message?.content ?? "").trim();
    const jsonText = raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "");

    //  Validate LLM output against strict schema
    let flashcards;
    try {
      flashcards = FlashcardArray.parse(JSON.parse(jsonText));
    } catch {
      return NextResponse.json(
        { error: "LLM did not return valid flashcard JSON", detail: raw.slice(0, 800) },
        { status: 502 }
      );
    }

    //  Optional persistence: if client passed uploadId, save the set and items
    let savedSet = null;
    if (uploadId) {
      savedSet = await prisma.flashcard_set.create({
        data: {
          upload_id: uploadId,
          text_data: sourceText,
          flashcard: {
            create: flashcards.map((fc) => ({
              question_front: fc.question_front,
              answer_back: fc.answer_back,
            })),
          },
        },
        include: { flashcard: true },
      });
    }

    //  Respond to client
    return NextResponse.json({ flashcards, savedSet });
  } catch (err: unknown) {
    // Normalize unknown errors and convert aborts to 504
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes("aborted") ? 504 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
