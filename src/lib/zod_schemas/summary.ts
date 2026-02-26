import { z } from "zod";

/** Client → /api/generate */
export const FlashcardsReq = z.object({
  uploadId: z.number().int().optional(),
}).refine(v => v.uploadId, {
  message: "UploadId not provided.",
});

export const SummaryItemSchema = z.object({
  header: z.string().min(1),
  text: z.string().min(1),
});
//SummaryItemArray ensures the LLM actually gave back an array of valid items, not random prose or malformed JSON.
export const SummaryItemArray = z.array(SummaryItemSchema).min(1);

export type SummaryElReq = z.infer<typeof FlashcardsReq>;
export type SummaryEl = z.infer<typeof SummaryItemSchema>;
