import { ServiceType } from "../error";
import { queryLLM } from "../utils/ai-gateway";

export async function getLectureTitle(text:string){
    const systmePrompt = "You are an model that returns just the title. Example: LECTURE 11: CLASSIFICATION I - DECISION TREES";
    const userPrompt = `Given this lecture snippet what is the lecture title \n\nSnippet: ${text}`;
    const lectureTitle:string = await queryLLM(systmePrompt, userPrompt, {type:ServiceType.AI_GENERATION});
    return lectureTitle;
}
