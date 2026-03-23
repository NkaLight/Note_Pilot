import { getSourceText } from "../db_access/upload";
import { ServiceError, ServiceType } from "../error";
import { queryLLM } from "../utils/ai-gateway";

export async function generateGlossary(uploadId, userId){
   const sourceText = (await getSourceText(uploadId, userId)).text_content;
       if(!sourceText){
           throw new ServiceError(
               "Source text is null", 
               ServiceType.AI_GENERATION
           );
       }

   const SYSTEM_PROMPT = `
        You generate concise glossary terms from academic text.
        Return ONLY a JSON array:
        [
        {"term": "Concept", "definition": "A short, factual explanation"},
        ...
        ]
        No markdown, no extra text, valid JSON only.
    `;    
    // Builds the AI prompt to make sure answers match
    const userPrompt = `
        Create a glossary of terms from this text.
        Return JSON ONLY:
        [
        {"term": "Term", "definition": "Definition"},
        ...
        ]
        Text:
        """${sourceText.slice(0, 12000)}"""
    `.trim();

    const result = await queryLLM(SYSTEM_PROMPT,userPrompt,{type:ServiceType.AI_GENERATION});
    return result;
}