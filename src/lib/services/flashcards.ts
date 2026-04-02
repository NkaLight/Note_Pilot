import {getSourceText} from "@/lib/db_access/upload";
import { FlashcardArray } from "../zod_schemas/flashcards";
import {createOrUpdateFlashCardSet} from "@/lib/db_access/flashcards";
import { DbError, ServiceError, ServiceType } from "../error";
import { queryLLM } from "../utils/ai-gateway";

// OpenRouter endpoint
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `
You are a flashcard generator that ONLY returns valid JSON arrays.

Respond ONLY with a JSON array where each element has:
- "question_front": the front of the flashcard (1 short question)
- "answer_back": the answer (1–2 concise sentences)

Never include extra text, markdown, explanations, or code fences.
Example output:
[
  {"question_front": "What is refactoring?", "answer_back": "Improving code without changing behavior."},
  {"question_front": "What is re-engineering?", "answer_back": "A major system redesign to modernize software."}
]
`.trim();

export async function generateFlashCardsSet(uploadId:number, user_id:number){
    //1. Get the source content using the uploadId 
    const sourceText = await getSourceText(uploadId, user_id);
    if(!sourceText){
        throw new ServiceError(
            `Source text is null params = uploadId:${uploadId} user_id:${user_id}`, 
            ServiceType.AI_GENERATION
        );
    }
    // Prepares prompt
    const userPrompt = `
        Generate flashcards from the following content.
        Output JSON ONLY as:
        [
        {"question_front": "...", "answer_back": "..."},
        ...
        ]
        Content:
        """${sourceText.text_content}"""
        `.trim();
    
    // Calls OpenRouter LLM
    const jsonText = await queryLLM(`Generate flashcards from the following content. Output JSON ONLY as: [
        {"question_front": "...", "answer_back": "..."},
        ...
        ]`,userPrompt,  {type:ServiceType.AI_GENERATION});
    let flashcards;
    try{
        flashcards = FlashcardArray.parse(JSON.parse(jsonText));
    }catch{
        throw new ServiceError(
            "AI provider did not return valid flashcard JSON", 
            ServiceType.AI_GENERATION
        );
    }
    let savedSet = null;
    try{
        //create of update flashcard_set this also adds updates to the flashcard too.
        savedSet = await createOrUpdateFlashCardSet(uploadId,flashcards, sourceText.text_content);
    }catch(error:any){
        if(error instanceof DbError){
            throw error;
        }
        throw new ServiceError("Internal error! Flashcard generateFlashCardSet", ServiceType.AI_GENERATION);
    }
    return savedSet.flashcard;
}