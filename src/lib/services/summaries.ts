import { getSourceText } from "../db_access/upload";
import { queryLLMStream, StreamChunk } from "../utils/ai-gateway";
import { ServiceError, ServiceType } from "../error";
import { saveSummary } from "../db_access/summary";

export async function generateSummaries(uploadId:number,userId:number){
    const textContent = await getSourceText(uploadId, userId);
    if(!textContent) throw new ServiceError("Source Text not found", ServiceType.AI_GENERATION, 404);

    const aiQuery = `You are a really smart student post-grad student making notes for the lecture. Make notes based on this current lecture.

            Lecture text:
            """
            ${textContent.text_content}
            """`;
            const SYSTEM_PROMPT = `
                    You are a lecture summarizer. Formatting rules (STRICT):
- Do NOT indent list items unless they are nested
- Use top-level bullet points with "-"
- Always insert a blank line after headings
- Do NOT use double spaces for spacing
- Use proper markdown paragraphs (blank lines).
Output ONLY valid markdown, no JSON, no code fences.

                    Use this exact structure:
                    # [Main Topic Title]

                    ## Overview
                    A 2-3 sentence overview of the lecture.

                    ## Key Concepts
                    ### [Concept Name]
                    Explanation of the concept with **bold** for key terms.

                    ### [Concept Name]
                    Explanation...

                    ## Summary
                    A concise paragraph tying everything together.

                    ## Key Takeaways
                    - Bullet point 1
                    - Bullet point 2
                    - Bullet point 3
                    `.trim();
    let llmText = "";
    const stream  = await queryLLMStream(SYSTEM_PROMPT, aiQuery, {  type: ServiceType.AI_GENERATION });
    return new ReadableStream({
        async start(controller){
            const reader = stream.getReader();
            const textDecode = new TextDecoder();
            try{
                 
                while(true){
                    const {done, value} = await reader.read();
                    if(done) break;
                    const raw  = textDecode.decode(value, {stream:true});
                    const lines = raw.split("\n").filter(l => l.startsWith("data: "));
                    for(const line of lines){
                        controller.enqueue(value);
                        try{
                            const parsed:StreamChunk = JSON.parse(line.slice(6));
                            if(parsed.type === "delta") llmText+=parsed.text;
                            if(parsed.type === "done") await saveSummary(uploadId, userId,llmText);
                            
                        }catch{
                            //ignore
                        }
                    }
                };
                controller.close();
            }catch(e){
                if(e instanceof ServiceError){
                    controller.enqueue(e);
                }else{
                    controller.enqueue(new ServiceError("Stream interupted", ServiceType.AI_GENERATION, 500));
                }
            }
        },cancel(){
            stream.cancel();
        }
    });
}
