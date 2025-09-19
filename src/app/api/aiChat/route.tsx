import { NextResponse } from "next/server";
import { z } from "zod";  
import { getSessionUser } from "@/lib/auth";

const chatMessageReqSchema = z.object({
    message: z.string()
})

export async function POST(req: Request){
    try{

        const user = await getSessionUser();
        if(!user) return new NextResponse("Unauthorized", {status: 404});
        
        const body = await req.json();
        const parsed = chatMessageReqSchema.safeParse(body);
        if(!parsed.success) return NextResponse.json({error:"Invalid request body"}, {status:400})
        
        const {message} = parsed.data
        //Construct message 
        const aiAPiUrl = "https://openrouter.ai/api/v1/chat/completions"

        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`
            },
            body: JSON.stringify({
                // The payload your AI service expects
                model: "nvidia/nemotron-nano-9b-v2:free",
                messages: [{ role: "user", content: message }],
                stream: false, // Enable streaming for real-time responses
            }),
        });

        if (!resp.ok){
            return NextResponse.json({error: resp.statusText}, {status: resp.status})
        }

        const data = await resp.json();
        const reply = data?.choices?.[0]?.message?.content ?? null;
        console.log(reply)
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