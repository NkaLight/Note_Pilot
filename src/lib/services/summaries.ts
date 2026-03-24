import { getSourceText } from "../db_access/upload";
import { queryLLM } from "../utils/ai-gateway";
import { ServiceError, AppError, ServiceType, DbError } from "../error";
import { SummaryItemArray } from "../zod_schemas/summary";
import { ZodError } from "zod";

export async function generateSummaries(uploadId:number,userId:number){
    try{
        const textContent = await getSourceText(uploadId, userId);
        if(!textContent) throw new AppError("Could not generateSummaries, getSourceText() is falsy");

        const aiQuery = `You are a really smart student post-grad student making notes for the lecture. Make notes based on this current lecture.

                Lecture text:
                """
                ${textContent.text_content}
                """`;
                const SYSTEM_PROMPT = `
                        You are a lecture summarizer. Output ONLY valid markdown, no JSON, no code fences.

                        Use this exact structure:
                        # [Main Topic Title]

                        ## Overview
                        A 2-3 sentence overview of the lecture.

                        ## Key Concepts
                        ### [Concept Name]
                        Explanation of the concept with **bold** for key terms.

                        ### [Concept Name]
                        Explanation...

                        ## Summary
                        A concise paragraph tying everything together.

                        ## Key Takeaways
                        - Bullet point 1
                        - Bullet point 2
                        - Bullet point 3

                        Where helpful, include a mermaid diagram to visualise relationships or processes.
                        `.trim();
        const data = await queryLLM(SYSTEM_PROMPT, aiQuery, {
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

export async function generateAndSaveSummaries(uploadId:number,userId:number){
    const summaries = await generateSummaries(uploadId, userId);
}