import { NextResponse } from "next/server";
import { getAuthedUserId, getSessionUser } from "@/lib/auth";
import { getLectureConentById } from "@/lib/prisma";


const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: Request){
    try{
        const userId = await getAuthedUserId();
        if(!userId) throw NextResponse.json({error: "Unauthorized", status: 401});

        const {mode, lectureId} = await req.json();
        console.log(mode, lectureId);

        if(!mode) throw NextResponse.json({error:"No mode selected", status: 400});
        if(!lectureId) throw NextResponse.json({error:"Lecture Id must be selected", status: 400});

        //GENERATE QUESTIONS
        if(mode == "generate"){
            const lecture = await getLectureConentById(lectureId);
            if (!lecture) return new NextResponse("Lecture not found", { status: 404 });

            const query = `You are an AI tutor. Generate 4–6 exam-style short answer questions based on the following lecture text. 
                    Each question must include:
                    1. "question": The question text.
                    2. "answer": The ideal answer for evaluation later.

                    Format your response as a JSON array, like:
                    [
                        {"question": "What is polymorphism in OOP?", "answer": "The ability of objects to take many forms..."},
                        {"question": "...", "answer": "..."}
                    ]

                    Lecture text:
                    """${lecture}"""
                    `;
            const resp = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`,
                    },
                    body: JSON.stringify({
                    model: "nvidia/nemotron-nano-9b-v2:free",
                    messages: [{ role: "user", content: query }],
                    }),
                });

                const data = await resp.json();
                const jsonStr = data?.choices?.[0]?.message?.content ?? "[]";
                const parsed = JSON.parse(jsonStr);

                return NextResponse.json({questions: parsed});
        }else if(mode === "evaluate"){
            

            

        }else{
            return new NextResponse("Invalid mode", { status: 400 });
        }
    }catch(err: any){
        console.error("Error at /api/problemsets");
        console.error(err?.stack || err);
        return new NextResponse("Internal server", {status: 500});
    }
}