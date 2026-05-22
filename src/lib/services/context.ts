/*
This library is where I will focus on multiple different ways we can get context from a single user input. 
 * This could include perhaps finding out user intent before trying to get the context, 
|* It could be generating the answer without referencing the updated lecture content then using initial generated data to better align the output to the course material.
*/
import { similaritySearch } from "../db_access/chunk";
import { pyClient } from "../externals/pyClient";
import { queryLLM } from "../utils/ai-gateway";
import {CHAT_HISTORY_FILTER_AND_HyDE} from "../prompts/rules";
import { ServiceType } from "../error";

/**
 * 
 * @param userInput used to generate a vector
 * @param paperId limits the similarity search for authorization 
 * @param userId authentication and authorization
 * @returns text context from performing vector similarity search on the userInput
 */
export async function getContext(userInput:string, paperId:number, userId:number):Promise<string>{
    const {vectors} = await pyClient.generateVector(userInput);
    return await similaritySearch(vectors, paperId, userId);
}

export async function getContextHyDE(userInput:string, paperId:number, userId:number, messages:{role:string, content:string}[]){
    const userPrompt = `Conversation history: ${messages}, current question: ${userInput}`;
    const result = await queryLLM(CHAT_HISTORY_FILTER_AND_HyDE,userPrompt,{type:ServiceType.CHAT_AI});
    const { relevant_turns, hypothesis }  = JSON.parse(result);
    const filteredHistory = messages.filter((_, i) => relevant_turns.includes(i));
    const {vectors} = await pyClient.generateVector(hypothesis);
    const context = await similaritySearch(vectors, paperId, userId);
    return {context, filteredHistory};
}

