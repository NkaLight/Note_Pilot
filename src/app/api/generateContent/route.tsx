import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getLectureConentById } from "@/lib/prisma";
import { DbError, ServiceError } from "@/lib/error";
import { getSummaries } from "@/lib/db_access/summaries";
import { generateSummaries } from "@/lib/services/summaries";
import { FlashcardsReq } from "@/lib/zod_schemas/summary";

/**
 * A route for generating structured content from the user's lecture text using OpenRouter.
 * The LLM is instructed to return valid JSON only.
 */

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * GET function 
 * @param req the request object containing lectureId and contentType.
 * @returns the generated summary in JSON format.
 */
export async function GET(req:Request){
  try{
    const user = await getSessionUser();
    if(!user) return NextResponse.json({error:"Unauthorized"}, {status: 401});

    const { searchParams } = new URL(req.url);
    const lectureId = searchParams.get("uploadId");
    if (!lectureId) {
      return NextResponse.json({error:"Missing lectureId "}, { status: 400 });
    }
    //TO avoid prop drilling we directly access the data layer, getSummaries already performs authorization.
    const summaries = await getSummaries(Number(lectureId), user.user_id);

    return NextResponse.json({content:summaries}, {status:200});  
  }catch(err){
    if(err instanceof DbError || err instanceof ServiceError){
      console.error(`[${err.name}]: ${err.message}`,{
        status:err.status,
        stack:err.stack,
        ...(err instanceof ServiceError &&{type: err.type})
      });
    }else{
      console.error("[UNEXPECTED_EXCEPTION]:", err);
    }
    return NextResponse.json({error:"Internal server error"}, {status:500});
  }
}

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
    const parsed = FlashcardsReq.safeParse(body);
    if(!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const uploadId = parsed.data.uploadId ?? null;

    if (!uploadId) {
      return new NextResponse("Missing lectureId", { status: 400 });
    }

    //Generate the summaries
    const summaries = await generateSummaries(uploadId, user.user_id);
    return NextResponse.json({ content: summaries }, {status:200});

  }catch (err: any) {
    if(err instanceof DbError || err instanceof ServiceError){
      console.error(`[${err.name}]: ${err.message}`,{
        status:err.status,
        stack:err.stack,
        ...(err instanceof ServiceError &&{type: err.type})
      });
    }else{
      console.error("[UNEXPECTED_EXCEPTION]:", err);
    }
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
