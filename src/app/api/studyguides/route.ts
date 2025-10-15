// src/app/api/studyguides/route.ts
/**
 * Study Guides API
 *
 * WHAT IT DOES:
 * - Requires authentication (via getSessionUser)
 * - Generates comprehensive study guides from paper content
 * - Supports AI level adaptation (early/intermediate/advanced)
 * - Provides CRUD operations for study guides
 *
 * ENDPOINTS:
 *   GET    - Fetch study guides for a paper
 *   POST   - Generate new study guide
 *   PUT    - Update existing study guide
 *   DELETE - Remove study guide
 */

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Request validators
const CreateStudyGuideReq = z.object({
    paperId: z.number(),
    title: z.string().min(1).max(255),
    aiLevel: z.enum(["early", "intermediate", "advanced"]).optional(),
});

const UpdateStudyGuideReq = z.object({
    id: z.number(),
    title: z.string().min(1).max(255).optional(),
    content: z.string().optional(),
});

// Study guide content structure
const StudyGuideContent = z.object({
    overview: z.string(),
    keyTopics: z.array(z.object({
        title: z.string(),
        description: z.string(),
        keyPoints: z.array(z.string()),
    })),
    studyTips: z.array(z.string()),
    practiceQuestions: z.array(z.object({
        question: z.string(),
        answer: z.string(),
    })),
    additionalResources: z.array(z.string()),
});

// AI level prompts
const AI_LEVEL_PROMPTS = {
    early: "Use simple, clear language suitable for children (ages 8-12). Focus on basic concepts with easy examples.",
    intermediate: "Use standard academic language suitable for university students. Include detailed explanations and examples.",
    advanced: "Use professional-level language with complex analysis, advanced concepts, and in-depth theoretical discussions."
};

// LLM setup
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `
You are an AI that creates comprehensive study guides from lecture content.
Always return ONLY a valid JSON object with this exact structure:
{
  "overview": "Brief overview of the main topic",
  "keyTopics": [
    {
      "title": "Topic Title",
      "description": "Detailed explanation of the topic",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ],
  "studyTips": ["Study tip 1", "Study tip 2", "Study tip 3"],
  "practiceQuestions": [
    {
      "question": "Practice question text",
      "answer": "Detailed answer explanation"
    }
  ],
  "additionalResources": ["Resource 1", "Resource 2", "Resource 3"]
}

No markdown, no extra text, just valid JSON.
`;

// GET - Fetch study guides for a paper
export async function GET(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const paperId = parseInt(searchParams.get("paperId") || "0");
        const aiLevel = searchParams.get("aiLevel") || undefined;

        if (!paperId) {
            return NextResponse.json({ error: "paperId is required" }, { status: 400 });
        }

        // Verify user owns the paper
        const paper = await prisma.paper.findFirst({
            where: { paper_id: paperId, user_id: user.user_id },
        });

        if (!paper) {
            return NextResponse.json({ error: "Paper not found" }, { status: 404 });
        }

        // Fetch study guides with optimized query
        const studyGuides = await prisma.study_guide.findMany({
            where: {
                paper_id: paperId,
                ...(aiLevel && { ai_level: aiLevel }),
            },
            select: {
                id: true,
                title: true,
                content: true,
                ai_level: true,
                created_at: true,
                updated_at: true,
                // Don't fetch unnecessary paper data
            },
            orderBy: { created_at: "desc" },
            // Add pagination for large datasets
            take: 20, // Limit to 20 study guides
        });

        // Add cache headers for better performance
        return NextResponse.json({ studyGuides }, {
            headers: {
                'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
            }
        });
    } catch (err: any) {
        console.error("GET studyguides error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

// POST - Generate new study guide
export async function POST(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parsed = CreateStudyGuideReq.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.message }, { status: 400 });
        }

        const { paperId, title, aiLevel = "intermediate" } = parsed.data;

        // Verify user owns the paper
        const paper = await prisma.paper.findFirst({
            where: { paper_id: paperId, user_id: user.user_id },
            include: { upload: true },
        });

        if (!paper) {
            return NextResponse.json({ error: "Paper not found" }, { status: 404 });
        }

        // Get paper content from uploads
        const textContent = paper.upload
            .map(upload => upload.text_content)
            .filter(Boolean)
            .join("\n\n");

        if (!textContent) {
            return NextResponse.json({ error: "No content found for this paper" }, { status: 400 });
        }

        // Build AI prompt
        const levelPrompt = AI_LEVEL_PROMPTS[aiLevel];
        const userPrompt = `
Create a comprehensive study guide for this content.
${levelPrompt}

Title: ${title}

Content to create study guide from:
"""${textContent.slice(0, 12000)}"""

Generate at least 3-5 key topics, 5-8 study tips, 3-5 practice questions, and 3-5 additional resources.
`.trim();

        // Call OpenRouter
        const resp = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_AI_API || process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
                "X-Title": "Note Pilot Study Guides",
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

        if (!resp.ok) {
            return NextResponse.json(
                { error: `AI Error: ${resp.statusText}` },
                { status: resp.status }
            );
        }

        const data = await resp.json();
        const raw = (data?.choices?.[0]?.message?.content ?? "").trim();
        const jsonText = raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "");

        // Validate AI output
        let studyGuideContent;
        try {
            const parsed = JSON.parse(jsonText);
            studyGuideContent = StudyGuideContent.parse(parsed);
        } catch (err) {
            return NextResponse.json(
                { error: "LLM did not return valid study guide JSON", detail: raw.slice(0, 800) },
                { status: 502 }
            );
        }

        // Save to database
        const studyGuide = await prisma.study_guide.create({
            data: {
                paper_id: paperId,
                title,
                content: JSON.stringify(studyGuideContent),
                ai_level: aiLevel,
            },
        });

        return NextResponse.json({ studyGuide: { ...studyGuide, content: studyGuideContent } });
    } catch (err: any) {
        console.error("POST studyguides error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

// PUT - Update existing study guide
export async function PUT(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const parsed = UpdateStudyGuideReq.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.message }, { status: 400 });
        }

        const { id, title, content } = parsed.data;

        // Verify user owns the study guide
        const studyGuide = await prisma.study_guide.findFirst({
            where: { 
                id,
                paper: { user_id: user.user_id }
            },
        });

        if (!studyGuide) {
            return NextResponse.json({ error: "Study guide not found" }, { status: 404 });
        }

        // Update study guide
        const updatedStudyGuide = await prisma.study_guide.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
            },
        });

        return NextResponse.json({ studyGuide: updatedStudyGuide });
    } catch (err: any) {
        console.error("PUT studyguides error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}

// DELETE - Remove study guide
export async function DELETE(req: NextRequest) {
    try {
        const user = await getSessionUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = parseInt(searchParams.get("id") || "0");

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        // Verify user owns the study guide
        const studyGuide = await prisma.study_guide.findFirst({
            where: { 
                id,
                paper: { user_id: user.user_id }
            },
        });

        if (!studyGuide) {
            return NextResponse.json({ error: "Study guide not found" }, { status: 404 });
        }

        // Delete study guide
        await prisma.study_guide.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("DELETE studyguides error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}