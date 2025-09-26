import { NextResponse } from "next/server";
import { z } from "zod";  
import { getSessionUser } from "@/lib/auth";
import fs from "fs";
import { pipeline } from "@xenova/transformers";


const chatMessageReqSchema = z.object({
    message: z.string()
})

//Load the chunks and vectors at startup
const chunks: string[] = JSON.parse(fs.readFileSync("src/data/chunks.json", "utf-8"));
const vectors: number[][] = JSON.parse(fs.readFileSync("src/data/vectors.json", "utf-8"));

// Cosine similarity
function cosineSimilarity(a: number[], b: number[]) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Retrieve top-k chunks
function retrieveTopK(queryVec: number[], vectors: number[][], chunks: string[], k = 3) {
    const scores = vectors.map((vec, i) => ({ i, score: cosineSimilarity(queryVec, vec) }));
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, k).map(s => chunks[s.i]);
}

export async function POST(req: Request){
    try{

        const user = await getSessionUser();
        if(!user) return new NextResponse("Unauthorized", {status: 404});
        
        const body = await req.json();
        const parsed = chatMessageReqSchema.safeParse(body);
        if(!parsed.success) return NextResponse.json({error:"Invalid request body"}, {status:400})
        
        const {message} = parsed.data


        /*RAG Implementation Not done. CURRENTLY JUST PASSING USER QUERY DIRECTLY TO LLM */
        // // Embed the user query
        // const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        // const queryVec = await embedder(message) as number[][]; // returns [ [ ... ] ]
        
        // // Retrieve top chunks
        // const topChunks = retrieveTopK(queryVec[0], vectors, chunks, 3);
        // const context = topChunks.join("\n\n");

        //Construct message 
        const aiAPiUrl = "https://openrouter.ai/api/v1/chat/completions"


        const contextualAIQuery = `
            Use the following context to answer the question.
            If the context does not contain the answer, say you don't know, ensure your response is human like dont explicitly mention context.

            Context:
            {context}

            Question:
            ${message}
        `

        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`
            },
            body: JSON.stringify({
                // The payload the AI service expects
                model: "nvidia/nemotron-nano-9b-v2:free",
                messages: [{ role: "user", content: message }],
                stream: false, // For streaming response currently not implemented.
            }),
        });

        if (!resp.ok){
            return NextResponse.json({error: resp.statusText}, {status: resp.status})
        }
        
        const data = await resp.json();
        const reply = data?.choices?.[0]?.message?.content ?? null;
        if(!reply) return NextResponse.json({message: ""});
        return NextResponse.json({message: reply});
        
        //This code section for implementing streaming, but the front-end has to be updated to handle that first.
        // return new NextResponse(resp.body, {
        //     headers: {
        //         "Content-Type": "text/event-stream",
        //         "Cache-Control": "no-cache",
        //     },
        // })
    }catch (err: unknown){ //handling type errors here
        console.error(err)
         let normError: Error;
        if(err instanceof Error){
            normError = err;
        }else{
            normError = new Error(String(err) || "An unknown error occurred.");
        }

        //Handling specific error types here.
        if (normError instanceof z.ZodError) {
        // For Zod validation errors, return the structured error messages.
        console.log("ZOD")
        return NextResponse.json({ error: normError.message }, { status: 400 });
        }
        return NextResponse.json({error: normError.message}, {status: 500}) //Return null 
    }
}