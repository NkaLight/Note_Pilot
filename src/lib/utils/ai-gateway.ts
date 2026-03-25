import { ServiceError, ServiceType } from "@/lib/error";

const DEFAULT_MODEL = "nvidia/nemotron-nano-9b-v2:free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface LLMOptions {
  model?: string;
  temperature?: number;
  type: ServiceType; 
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/**
 * Centralized LLM fetcher alongside making our LLM queries more declarative
 * Returns data as json
 * 
 */
export async function queryLLM(systemPrompt: string, userPrompt: string, options: LLMOptions){
    const { model = DEFAULT_MODEL, temperature = 0.2, type } = options;
    try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`,
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Note Pilot",
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!resp.ok) {
      throw new ServiceError(`AI Provider Error: ${resp.status}`, type, 502);
    }

    const data = await resp.json();
    const rawContent = data?.choices?.[0]?.message?.content ?? "";

    // Centralized JSON cleaning (Markdown fence removal)
    return rawContent.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/i, "").trim();

  } catch (err: any) {
    if (err instanceof ServiceError) throw err;
    throw new ServiceError(err.message || "AI Network Failure", type, 503);
  }
}

// export async function queryLLMStream(systemPrompt:string, userPrompt:string, options:LLMOptions){
//   const { model = DEFAULT_MODEL, temperature, type } = options;
//   try{
//     const resp = await fetch(API_URL, {
//       method:"POST", 
//       headers:{
//         "Content-Type": "application/json",
//         "Authorization":`Bearer ${process.env.NVIDIA_AI_API}`,
//         "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
//         "X-Title": "Note Pilot",
//       }
//     })
//   }

// }

export type StreamChunk =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function queryLLMStream(
  systemPrompt: string,
  userPrompt:string,
  options: LLMOptions
){
  const {model = DEFAULT_MODEL, temperature = 0.7, type,} = options;
  const resp = await fetch(API_URL, {
    method:"POST", 
    headers:{
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.NVIDIA_AI_API}`,
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Note Pilot",
    },
    body:JSON.stringify({
      model, temperature, messages:[
        {role: "system", content:systemPrompt},
        {role:"user", content:userPrompt}
      ],
      stream: true
    })

  });
  if(!resp.ok) throw new ServiceError(`queryLLMChatStream Error: ${resp.status}`,type, 502);
  return new ReadableStream({
    async start(controller) {
        const reader = resp.body.getReader();
        const textCode = new TextDecoder();

        const emit = (chunk:StreamChunk)=>{
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
          );
        };
        try{
          // eslint-disable-next-line no-constant-condition
          while(true){
            const {done, value} = await reader.read();
            if(done){
              break;
            }
            const raw  = textCode.decode(value, {stream:true});
            const lines = raw.split("\n").filter((l) => l.startsWith("data: "));
            
            for(const line of lines){
              const payload = line.slice(6);
              if(payload === "[DONE]"){
                emit({type:"done"});
                controller.close();
                return;
              }
              try{
                const text = JSON.parse(payload)?.choices?.[0]?.delta.content;
                if(text){
                  emit({type:"delta", text});
                }
              }catch{
                //Partial skipped.
              }
            }
          }
        }catch(error){
          emit({type:"error", message:error});
        }
    },
  });
}