import {getSourceText} from "@/lib/db_access/upload";
import { FlashcardArray } from "../zod_schemas/flashcards";
import {createOrUpdateFlashCardSet} from "@/lib/db_access/flashcards";
import { DbError, ServiceError, ServiceType } from "../error";
import { queryLLM } from "../utils/ai-gateway";

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
        savedSet = await createOrUpdateFlashCardSet(uploadId, flashcards);
    }catch(error:any){
        if(error instanceof DbError){
            throw error;
        }
        throw new ServiceError("Internal error! Flashcard generateFlashCardSet", ServiceType.AI_GENERATION);
    }
    return savedSet.flashcard;
}