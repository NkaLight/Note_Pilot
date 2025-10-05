//src/app/api/glossary/route.ts
/**
 * Glossary Generation API
 *
 * WHAT IT DOES
 * - Requires authentication (via getSessionUser)
 * - Generates glossary terms from uploaded text or direct input
 * - Links glossary entries to the upload record (and thus to the correct paper/user)
 * - Optionally persists glossary + term data in the database
 *
 * INPUT:
 *   { text?: string, uploadId?: number }
 *
 * OUTPUT:
 *   200 OK → { glossary: [...], savedGlossary?: {...} }
 *   401/400/500 → { error, detail? }
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Request validator
const GlossaryReq = z
    .object({
        text: z.string().optional(),
        uploadId: z.number().optional(),
    })
    .refine((v) => v.text || v.uploadId, {
        message: "Provide either 'text' or 'uploadId'.",
    });

// Expected AI output
const TermArray = z.array(
    z.object({
        term: z.string(),
        definition: z.string(),
    })
);

// LLM setup
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const SYSTEM_PROMPT = `
You generate concise glossary terms from academic text.
Return ONLY a JSON array:
[
  {"term": "Concept", "definition": "A short, factual explanation"},
  ...
]
No markdown, no extra text, valid JSON only.
`;

export async function POST(req: Request) {
    try {
        // Auth check
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Validate request
        const body = await req.json();
        const parsed = GlossaryReq.safeParse(body);
        if (!parsed.success)
            return NextResponse.json({ error: parsed.error.message }, { status: 400 });

        let sourceText = parsed.data.text ?? "";
        const uploadId = parsed.data.uploadId ?? null;

        // If uploadId provided, fetch the associated text
        if (!sourceText && uploadId) {
            const summary = await prisma.summary.findUnique({
                where: { upload_id: uploadId },
                select: { text_data: true },
            });
            if (!summary?.text_data)
                return NextResponse.json({ error: "No text found for uploadId" }, { status: 404 });
            sourceText = summary.text_data;
        }

        // Builds the AI prompt to make sure answers match
        const userPrompt = `
Create a glossary of terms from this text.
Return JSON ONLY:
[
  {"term": "Term", "definition": "Definition"},
  ...
]
Text:
"""${sourceText.slice(0, 12000)}"""
`.trim();

        // Calls OpenRouter
        const resp = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_AI_API || process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
                "X-Title": "Note Pilot Glossary",
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-nano-9b-v2:free",
                temperature: 0.2,
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

        // Validates AI output
        let terms;
        try {
            terms = TermArray.parse(JSON.parse(jsonText));
        } catch {
            return NextResponse.json(
                { error: "LLM did not return valid glossary JSON", detail: raw.slice(0, 800) },
                { status: 502 }
            );
        }

        // Saves to DB
        let savedGlossary = null;
        if (uploadId) {
            // Retrieve upload + paper info for context
            const upload = await prisma.upload.findUnique({
                where: { upload_id: uploadId },
                include: { paper: true },
            });

            if (!upload)
                return NextResponse.json({ error: "Upload not found" }, { status: 404 });

            savedGlossary = await prisma.glossary.create({
                data: {
                    upload_id: uploadId,
                    text_data: sourceText,
                    term: {
                        create: terms.map((t) => ({
                            term_data: `${t.term}: ${t.definition}`,
                        })),
                    },
                },
                include: {
                    term: true,
                    upload: {
                        select: {
                            upload_id: true,
                            filename: true,
                            paper: { select: { name: true, code: true } },
                        },
                    },
                },
            });
        }

        // Returns glossary + linked paper info
        return NextResponse.json({
            glossary: terms,
            savedGlossary,
        });
    } catch (err: any) {
        console.error("Glossary route error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}