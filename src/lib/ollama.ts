// src/lib/ollama.ts
import ollama from "ollama";
const DEFAULT_MODEL = "gemma:2b";

export async function summarizeWithOllama(text: string, model = DEFAULT_MODEL) {
  const prompt = `Summarize the following text in clear bullet points:\n\n${text}`;
  try {
    const res = await ollama.chat({
      model,
      stream: false,
      messages: [{ role: "user", content: prompt }],
    });
    if (!res?.message?.content) {
      throw new Error("Ollama returned an empty summary");
    }
    return res.message.content;
  } catch (err: any) {
    throw new Error(`Ollama chat failed: ${err?.message || err}`);
  }
}
