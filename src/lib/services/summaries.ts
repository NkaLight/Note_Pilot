import { text } from "stream/consumers";
import { getSourceText } from "../db_access/upload";
import { queryLLM } from "../utils/ai-gateway";
import { ServiceError, AppError, ServiceType, DbError } from "../error";
import { SummaryItemArray } from "../zod_schemas/summary";
import { ZodError } from "zod";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function generateSummaries(uploadId:number,userId:number){
    try{
        const textContent = await getSourceText(uploadId);
        if(!textContent) throw new AppError("Could not generateSummaries, getSourceText() is falsy");

        const aiQuery = `You are an AI that summarizes lecture content into a structured JSON array. 
        Generate **at least 5 objects**, each with:
        1. "header": a concise title.
        2. "text": summarized text with <strong>...</strong> tags highlighting key concepts.

        Return the data as a valid JSON array ONLY, with no extra text outside the array.

        Lecture text:
        """
        ${textContent}
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
        const systemPrompt = "You are an AI that outputs JSON only, no explanations.";
        const data = await queryLLM(systemPrompt, aiQuery, {
            type: ServiceType.AI_GENERATION
        });
        return SummaryItemArray.parse(JSON.parse(data));

    }catch(err){
        if(err instanceof DbError || err instanceof ServiceError || err instanceof AppError){
            throw err;
        }
        if(err instanceof ZodError){
            throw new ServiceError("Failed to parse AI summary JSON", ServiceType.AI_GENERATION);
        }
        throw new ServiceError(`Failed to generateSummaries ${err}`, ServiceType.AI_GENERATION);
    }
}