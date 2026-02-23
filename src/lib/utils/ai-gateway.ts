import { ServiceError, ServiceType } from "@/lib/error";

const DEFAULT_MODEL = "nvidia/nemotron-nano-9b-v2:free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

interface LLMOptions {
  model?: string;
  temperature?: number;
  type: ServiceType; 
}

/**
 * Centralized LLM fetcher alongside making our LLM queries more declarative
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
    // Wrap generic fetch/network errors into your ServiceError
    throw new ServiceError(err.message || "AI Network Failure", type, 503);
  }
}