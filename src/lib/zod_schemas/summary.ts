import { z } from "zod";

/** Client → /api/generate */
export const FlashcardsReq = z.object({
  uploadId: z.number().int().optional(),
}).refine(v => v.uploadId, {
  message: "UploadId not provided.",
});

export const SummaryItem = z.object({
  header: z.string().min(1),
  text: z.string().min(1),
});
//FlashcardArray ensures the LLM actually gave back an array of valid items, not random prose or malformed JSON.
export const SummaryItemArray = z.array(SummaryItem).min(1);

export type FlashcardsRequest = z.infer<typeof FlashcardsReq>;
export type SummaryEl = z.infer<typeof SummaryItem>;
