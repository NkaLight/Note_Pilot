/*
This library is where I will focus on multiple different ways we can get context from a single user input. 
 * This could include perhaps finding out user intent before trying to get the context, 
|* It could be generating the answer without referencing the updated lecture content then using initial generated data to better align the output to the course material.
*/
import { similaritySearch } from "../db_access/chunk";
import { pyClient } from "../externals/pyClient";

/**
 * 
 * @param userInput used to genrate a vector
 * @param paperId limits the similarity search for authorization 
 * @param userId authentication and authorization
 * @returns text context from performing vector similarity search on the userInput
 */
export async function getContext(userInput:string, paperId:number, userId:number):Promise<string>{
    const {vectors} = await  pyClient.generateVector(userInput);
    return await similaritySearch(vectors, paperId, userId);
}
