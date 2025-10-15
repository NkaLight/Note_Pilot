// src/app/api/summaries/route.ts
/**
 * Summaries Generation API
 *
 * WHAT IT DOES:
 * - Requires authentication (via getSessionUser)
 * - Generates structured summaries from uploaded text or direct input
 * - Creates multiple summary sections with headers and formatted content
 * - Supports both single upload and combined text input
 *
 * INPUT:
 *   { text?: string, uploadId?: number }
 *
 * OUTPUT:
 *   200 OK → { content: [...] }
 *   401/400/500 → { error, detail? }
 */

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

// Request validator
const SummariesReq = z
    .object({
        text: z.string().optional(),
        uploadId: z.number().optional(),
    })
    .refine((v) => v.text || v.uploadId, {
        message: "Provide either 'text' or 'uploadId'.",
    });

// Expected AI output
const SummaryArray = z.array(
    z.object({
        header: z.string(),
        text: z.string(),
    })
);

// LLM setup
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SYSTEM_PROMPT = `
You are an AI that summarizes lecture content into structured JSON array format.
Generate **at least 5 objects**, each with:
1. "header": a concise, descriptive title
2. "text": summarized content with <strong>...</strong> tags highlighting key concepts

Return ONLY a valid JSON array, no markdown, no extra text.
`;

export async function POST(req: Request) {
    try {
        // Auth check
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Validate request
        const body = await req.json();
        const parsed = SummariesReq.safeParse(body);
        if (!parsed.success)
            return NextResponse.json({ error: parsed.error.message }, { status: 400 });

        let sourceText = parsed.data.text ?? "";
        const uploadId = parsed.data.uploadId ?? null;

        // If uploadId provided, fetch the associated text
        if (!sourceText && uploadId) {
            const upload = await prisma.upload.findUnique({
                where: { upload_id: uploadId },
                select: { text_content: true },
            });
            if (!upload?.text_content)
                return NextResponse.json({ error: "No text found for uploadId" }, { status: 404 });
            sourceText = upload.text_content;
        }

        // Build the AI prompt for summaries
        const userPrompt = `
Generate a structured summary from this content.
Return JSON ONLY as an array:
[
  {
    "header": "Section Title",
    "text": "Summary with <strong>key concepts</strong> highlighted..."
  },
  ...
]

Content to summarize:
"""${sourceText.slice(0, 12000)}"""
`.trim();

        // Call OpenRouter
        const resp = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_AI_API || process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
                "X-Title": "Note Pilot Summaries",
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-nano-9b-v2:free",
                temperature: 0.3,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                ],
            }),
        });

        if (!resp.ok)
            return NextResponse.json(
                { error: `AI Error: ${resp.statusText}` },
                { status: resp.status }
            );

        const data = await resp.json();
        const raw = (data?.choices?.[0]?.message?.content ?? "").trim();
        const jsonText = raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "");

        // Validate AI output
        let summaries;
        try {
            summaries = SummaryArray.parse(JSON.parse(jsonText));
        } catch {
            return NextResponse.json(
                { error: "LLM did not return valid summaries JSON", detail: raw.slice(0, 800) },
                { status: 502 }
            );
        }

        // Return summaries in the expected format
        return NextResponse.json({
            content: summaries,
        });
    } catch (err: any) {
        console.error("Summaries route error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}