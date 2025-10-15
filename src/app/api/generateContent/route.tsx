import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLectureConentById } from "@/lib/prisma";

/**
 * A route for generating structured content from the user's lecture text using OpenRouter.
 * The LLM is instructed to return valid JSON only.
 */

const API_URL = "https://openrouter.ai/api/v1/chat/completions"

/**
 * POST function
 * @param req the request object containing lectureId and contentType.
 * @returns the generated summary in JSON format.
 */
export async function POST(req: Request) {
  try {
    // Check user authentication
    const user = await getSessionUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 }); // 401 is more standard than 404
    }

    // Parse request body (assuming JSON)
    const body = await req.json();
    const { lectureId, contentType } = body;

    if (!lectureId || !contentType) {
      return new NextResponse("Missing lectureId or contentType", { status: 400 });
    }

    // Fetch lecture content from DB
    // Example function: getLectureTextById
    const lecture = await getLectureConentById(lectureId);

    if (!lecture) {
      return new NextResponse("Lecture not found", { status: 404 });
    }

    //LLM Query
    const aiQuery = `You are an AI that summarizes lecture content into a structured JSON array. 
        Generate **at least 5 objects**, each with:
        1. "header": a concise title.
        2. "text": summarized text with <strong>...</strong> tags highlighting key concepts.

        Return the data as a valid JSON array ONLY, with no extra text outside the array.

        Lecture text:
        """
        ${lecture}
        """

        Example output:
        [
        {
            "header": "Introduction to Algorithms",
            "text": "Algorithms are <strong>step-by-step procedures</strong> for solving problems efficiently..."
        },
        {
            "header": "Time Complexity",
            "text": "We measure <strong>algorithm performance</strong> by..."
        }
        ]`;
    // QUERY the LLM
    const resp = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-nano-9b-v2:free",
                messages: [{ role: "system", content: "You are an AI that outputs JSON only, no explanations." }, { role: "user", content: aiQuery }], 
                stream: false, // For streaming response currently not implemented.
            }),
        });

    const data = await resp.json();
    console.log(data);
    const reply = data?.choices?.[0]?.message?.content ?? null;
    console.log(reply)


    let replyJson = {};
        try {
        replyJson = JSON.parse(reply);
        console.log(replyJson)
        } catch (e) {
        console.error("Failed to parse LLM response as JSON:", reply);
        replyJson = { text: reply };
        }
    
    return NextResponse.json({ content: replyJson });
  } catch (err: any) {
    console.error("Error in POST /api/generateContent:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
