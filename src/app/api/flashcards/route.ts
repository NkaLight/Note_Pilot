/**
 * Flashcard generation API (server-only, Next.js App Router)
 *
 * WHAT IT DOES
 * - Authenticates the user.
 * - Uses OpenRouter AI to generate flashcards (Q/A pairs) from uploaded text or user input.
 * - Persists flashcards in the database tied to a specific upload (or creates a dummy one if needed).
 * - Uses `upsert` so that re-generating flashcards for the same upload overwrites old ones.
 * - Adds a GET route to reload persisted flashcards for the logged-in user.
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FlashcardsReq, FlashcardArray } from "@/lib/zod_schemas/flashcards";

// OpenRouter endpoint
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `
You are a flashcard generator that ONLY returns valid JSON arrays.

Respond ONLY with a JSON array where each element has:
- "question_front": the front of the flashcard (1 short question)
- "answer_back": the answer (1–2 concise sentences)

Never include extra text, markdown, explanations, or code fences.
Example output:
[
  {"question_front": "What is refactoring?", "answer_back": "Improving code without changing behavior."},
  {"question_front": "What is re-engineering?", "answer_back": "A major system redesign to modernize software."}
]
`.trim();

/**
 * GET — Fetch all flashcard sets belonging to the logged-in user.
 * This allows persistence across page refreshes.
 */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Optional: allow fetching by uploadId via query param (?uploadId=19)
  const url = new URL(req.url);
  const uploadId = url.searchParams.get("uploadId");

  try {
    const flashcards = uploadId
      ? await prisma.flashcard.findMany({
        where: {
          flashcard_set: {
            upload_id: Number(uploadId),
            upload: {
              paper: { user_id: user.user_id },
            },
          },
        },
        orderBy: { flashcard_id: "asc" },
      })
      : await prisma.flashcard.findMany({
        where: {
          flashcard_set: {
            upload: { paper: { user_id: user.user_id } },
          },
        },
        orderBy: { flashcard_id: "asc" },
      });

    return NextResponse.json({ flashcards });
  } catch (err) {
    console.error("GET /api/flashcards error:", err);
    return NextResponse.json(
      { error: "Failed to load flashcards" },
      { status: 500 }
    );
  }
}
/**
 * POST — Generate & persist flashcards using AI.
 */
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = FlashcardsReq.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    // Resolves source text (direct or from upload)
    let sourceText = parsed.data.text ?? "";
    const uploadId = parsed.data.uploadId ?? null;

    if (!sourceText && uploadId) {
      const summary = await prisma.summary.findUnique({
        where: { upload_id: uploadId },
        select: { text_data: true },
      });
      if (!summary?.text_data)
        return NextResponse.json({ error: "No text found for given uploadId." }, { status: 404 });
      sourceText = summary.text_data;
    }

    // Prepares prompt
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

    // Calls OpenRouter LLM
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Note Pilot Flashcards",
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

    // Checks LLM response
    const ctype = resp.headers.get("content-type") || "";
    if (!resp.ok) {
      const errText = ctype.includes("application/json")
        ? JSON.stringify(await resp.json())
        : await resp.text();
      return NextResponse.json(
        { error: `Upstream error: ${resp.status} ${resp.statusText}`, detail: errText.slice(0, 800) },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const raw = (data?.choices?.[0]?.message?.content ?? "").trim();
    const jsonText = raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "");

    // Validates JSON schema
    let flashcards;
    try {
      flashcards = FlashcardArray.parse(JSON.parse(jsonText));
    } catch {
      return NextResponse.json(
        { error: "LLM did not return valid flashcard JSON", detail: raw.slice(0, 800) },
        { status: 502 }
      );
    }

    // Handle persistence: link flashcards to the user's most recent paper
    let savedSet = null;
    let actualUploadId = uploadId;

    if (!actualUploadId) {
      // Find the latest paper created by this user
      let paper = await prisma.paper.findFirst({
        where: { user_id: user.user_id },
        orderBy: { paper_id: "desc" },
        select: { paper_id: true },
      });

      // If the user has no papers at all, create a default one
      if (!paper) {
        paper = await prisma.paper.create({
          data: {
            user_id: user.user_id,
            name: "Flashcards" + paper,
            code: "AI",
            description: "Automatically created to store AI-generated flashcards.",
          },
          select: { paper_id: true },
        });
      }

      // Creates a new upload record tied to that paper
      const upload = await prisma.upload.create({
        data: {
          paper_id: paper.paper_id,
          filename: `FlashCards${Date.now()}.txt`,
          storage_path: "N/A",
          text_content: sourceText,
        },
        select: { upload_id: true },
      });

      actualUploadId = upload.upload_id;
    }

    // Saves or updates the flashcard set for this upload
    savedSet = await prisma.flashcard_set.upsert({
      where: { upload_id: actualUploadId },
      update: {
        text_data: sourceText,
        flashcard: {
          deleteMany: {}, // remove old cards for same upload
          create: flashcards.map((fc) => ({
            question_front: fc.question_front,
            answer_back: fc.answer_back,
          })),
        },
      },
      create: {
        upload_id: actualUploadId,
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

    // Returns flashcards + saved data
    return NextResponse.json({ flashcards, savedSet });
  } catch (err: any) {
    console.error("POST flashcards error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.includes("aborted") ? 504 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
