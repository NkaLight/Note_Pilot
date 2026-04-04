/**
 * Flashcard generation API (server-only, Next.js App Router)
 *
 * WHAT IT DOES:
 * Authenticates the user.
 * Uses OpenRouter AI to generate flashcards (Q/A pairs) from uploaded text or user input.
 * Persists flashcards in the database tied to a specific upload (or creates a dummy one if needed).
 * Uses `upsert` so that re-generating flashcards for the same upload overwrites old ones.
 * Adds a GET route to reload persisted flashcards for the logged-in user.
 */

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getFlashCards } from "@/lib/db_access/flashcards";
import { FlashcardsReq,} from "@/lib/zod_schemas/flashcards";
import {generateFlashCardsSet} from "@/lib/services/flashcards";
import { DbError, ServiceError } from "@/lib/error";

/**
 * GET — Fetch all flashcard sets belonging to the logged-in user.
 * This allows persistence across page refreshes.
 */
export async function GET(req: Request) {
  const {user} = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const uploadId = url.searchParams.get("uploadId");

  if(!uploadId){
    return NextResponse.json({error: "Invalid input."}, {status:400});
  }
  try {
    const flashcards = await getFlashCards(Number(uploadId), user.user_id);
    return NextResponse.json({ flashcards }, {status:200});
  } catch (err) {
    if(err instanceof DbError || err instanceof ServiceError){
      console.error(`[${err.name}]: ${err.message}`,{
        status:err.status,
        stack:err.stack,
        ...(err instanceof ServiceError &&{type: err.type})
      });
    }else{
      console.error("[UNEXPECTED_EXCEPTION]:", err);
    }
    return NextResponse.json({error: "Internal server error"}, {status: 500});
  }
}
/**
 * POST — Generate & persist flashcards using AI.
 */
export async function POST(req: Request) {
  try {
    const {user} = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = FlashcardsReq.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const uploadId = parsed.data.uploadId ?? null;

    const flashcards = await generateFlashCardsSet(uploadId, user.user_id);
 
    return NextResponse.json({ flashcards}, {status:200});
  } catch (err: any) {
    if(err instanceof DbError || err instanceof ServiceError){
      console.error(`[${err.name}]: ${err.message}`,{
        status:err.status,
        stack:err.stack,
        ...(err instanceof ServiceError &&{type: err.type})
      });
    }else{
      console.error("[UNEXPECTED_EXCEPTION]:", err);
    }
    return NextResponse.json({ error: "Internal server error" }, { status:500});
  }
}
