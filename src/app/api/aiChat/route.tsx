import { getSessionUser } from "@/lib/auth";
import { getLectureConentById } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * A route for AI chat interactions (Node runtime).
 * Contains some redundant code for future RAG implementation.
 */

/** Schema validation for incoming chat message requests */
const chatMessageReqSchema = z.object({
    message: z.string(),
    uploadId: z.number().optional(),
    uploadIds: z.array(z.number()).optional(),
    paperId: z.number().optional()
})

/** IGNORE: This function is for RAG (Retrieval Augmented Generation)
* however, the RAG implementation is not complete yet.
* Load the chunks and vectors at startup
* const chunks: string[] = JSON.parse(fs.readFileSync("src/data/chunks.json", "utf-8"));
* const vectors: number[][] = JSON.parse(fs.readFileSync("src/data/vectors.json", "utf-8"));
*/
function cosineSimilarity(a: number[], b: number[]) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** IGNORE: This function is for RAG (Retrieval Augmented Generation) */
function retrieveTopK(queryVec: number[], vectors: number[][], chunks: string[], k = 3) {
    const scores = vectors.map((vec, i) => ({ i, score: cosineSimilarity(queryVec, vec) }));
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, k).map(s => chunks[s.i]);
}

/**
 * Handles POST requests to /api/aiChat.
*/
export async function POST(req: Request){
    try{

        const user = await getSessionUser();
        if(!user) return new NextResponse("Unauthorized", {status: 404});
        
        const body = await req.json();
        const parsed = chatMessageReqSchema.safeParse(body);
        if(!parsed.success) return NextResponse.json({error:"Invalid request body"}, {status:400})
        
        const {message, uploadId, uploadIds, paperId} = parsed.data;

        // Gather context from uploads
        let contextText = "";
        const activeUploadIds = uploadIds && uploadIds.length > 0 ? uploadIds : (uploadId ? [uploadId] : []);
        
        if (activeUploadIds.length > 0) {
            console.log(`Fetching context from ${activeUploadIds.length} uploads: ${activeUploadIds.join(', ')}`);
            
            // Fetch content from all selected uploads
            const contextPromises = activeUploadIds.map(async (id) => {
                try {
                    const content = await getLectureConentById(id.toString());
                    return content ? `--- Content from Upload ${id} ---\n${content}\n` : "";
                } catch (error) {
                    console.error(`Failed to fetch content for upload ${id}:`, error);
                    return "";
                }
            });
            
            const contextArray = await Promise.all(contextPromises);
            contextText = contextArray.filter(content => content.length > 0).join("\n");
            
            console.log(`Context gathered: ${contextText.length} characters from ${contextArray.filter(c => c.length > 0).length} uploads`);
        } else {
            console.log("No upload context provided");
        }


        /* RAG Implementation Not done. CURRENTLY JUST PASSING USER QUERY DIRECTLY TO LLM
        // Embed the user query
        const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        const queryVec = await embedder(message) as number[][]; // returns [ [ ... ] ]
        
        // Retrieve top chunks
        const topChunks = retrieveTopK(queryVec[0], vectors, chunks, 3);
        const context = topChunks.join("\n\n");
        */

        //Construct message 
        const aiAPIUrl = "https://openrouter.ai/api/v1/chat/completions"


        // Construct message with context
        const contextualAIQuery = contextText.length > 0 ? `
            Use the following context from lecture materials to answer the question.
            If the context does not contain enough information to answer the question completely, 
            provide what you can based on the context and indicate what information might be missing.
            Keep your response natural and conversational.

            Context from selected lectures:
            ${contextText}

            Question:
            ${message}
        ` : message;

        const resp = await fetch(aiAPIUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-nano-9b-v2:free",
                messages: [{ role: "user", content: contextualAIQuery }],
                stream: false,
            }),
        });

        if (!resp.ok){
            return NextResponse.json({error: resp.statusText}, {status: resp.status})
        }
        
        const data = await resp.json();
        const reply = data?.choices?.[0]?.message?.content ?? null;
        if(!reply) return NextResponse.json({message: ""});
        return NextResponse.json({message: reply});
        
        /* This code section for implementing streaming, but the front-end has to be updated to handle that first.
        return new NextResponse(resp.body, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
            },
        }) */
    }catch (err: unknown){
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