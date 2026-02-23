//src/lib/zod_schemas/flashcards.ts
/**
 * Zod schemas for flashcard generation/validation.
 *
 * WHY THIS EXISTS
 * - Prisma schema defines DB structure (columns in Supabase),
 *   but does not validate runtime data coming into/out of the API.
 * - Zod schemas enforce contracts at runtime for:
 *   1) API request body (must have either `text` or `uploadId`).
 *   2) LLM responses (must be a JSON array of objects with
 *      `question_front` and `answer_back` strings).
 *
 * BENEFITS
 * - Protects against invalid/malformed client input.
 * - Guards against LLM hallucinations or junk responses.
 * - Ensures only clean, predictable data flows into Prisma/DB.
 */
import { z } from "zod";

/** Client → /api/flashcards */
export const FlashcardsReq = z.object({
  uploadId: z.number().int().optional(),
}).refine(v => v.uploadId, {
  message: "UploadId not provided.",
});

export const FlashcardItem = z.object({
  question_front: z.string().min(1),
  answer_back: z.string().min(1),
});
//FlashcardArray ensures the LLM actually gave back an array of valid items, not random prose or malformed JSON.
export const FlashcardArray = z.array(FlashcardItem).min(1);

export type FlashcardsRequest = z.infer<typeof FlashcardsReq>;
export type Flashcard = z.infer<typeof FlashcardItem>;
