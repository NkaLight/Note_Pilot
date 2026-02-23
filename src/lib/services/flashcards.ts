import {getSourceText} from "@/lib/db_access/upload";
import { FlashcardArray } from "../zod_schemas/flashcards";
import {createOrUpdateFlashCardSet} from "@/lib/db_access/flashcards";
import { DbError, ServiceError, ServiceType } from "../error";

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
    const sourceText = await getSourceText(uploadId);
    if(!sourceText){
        throw new ServiceError(
            "Source text is null", 
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const resp = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Note Pilot Flashcards",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-9b-v2:free",
        temperature: 0.2,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    }).finally(() => clearTimeout(timeout));
    //Check LLM response
    if(!resp.ok){
        throw new ServiceError(
            "AI provider failed to return flashcards", 
            ServiceType.AI_GENERATION
        );
    }
    const data = await resp.json();
    const raw = (data?.choices?.[0]?.message?.content ?? "").trim();
    const jsonText = raw.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "");
    
    //Validates JSON schema
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