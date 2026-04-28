import { queryLLMStream, StreamChunk } from "../utils/ai-gateway";
import { getChatMessages, saveNewMessages } from "../db_access/chat_message";
import { ServiceError, ServiceType } from "../error";
import { similaritySearch } from "../db_access/chunk";
import { pyClient } from "../externals/pyClient";

export async function streamChat(uploadId:number ,userId: number, prompt: string):Promise<ReadableStream>{
    const uploadIdNum = Number(uploadId);
    const context = await getContext(prompt, uploadIdNum, userId);
    console.error(context);
    if (!context) {
        throw new ServiceError("Upload not found or access denied", ServiceType.CHAT_AI, 401);
    }
    const priorMessages = await getChatMessages(uploadIdNum, userId);

const systemPrompt = context
  ? `You are a helpful study assistant.
    Answer ONLY using the provided lecture material.
    If the answer is not in the material, say "I don't know based on the uploaded course material please upload more content about the paper."
    Lecture material:
    ${context}`
    : "You are a helpful study assistant. If no context is provided, say you don't have lecture material.";

    const history = priorMessages.map(m => `${m.role}: ${m.content}`).join("\n");
    const fullPrompt = `${history}\nuser: ${prompt}`;

    let LLMText = "";
    const stream = await queryLLMStream(systemPrompt, fullPrompt, {type:ServiceType.CHAT_AI});
    return new ReadableStream({
        async start(controller){
            const reader = stream.getReader();
            const textCode = new TextDecoder();
            try{
                 
                while(true){
                    const {done, value} = await reader.read();
                    if(done){
                        break;
                    }
                    const raw = textCode.decode(value, {stream:true});
                    const lines = raw.split("\n").filter((l)=> l.startsWith("data: "));
                    for(const line of lines){
                        try{
                            const parsed:StreamChunk = JSON.parse(line.slice(6));
                            if(parsed.type === "delta")LLMText += parsed.text;
                            if(parsed.type === "done"){//Update DB side.
                                await saveNewMessages(uploadId, userId, context, LLMText); 
                            }
                        }catch{
                            //ignore
                        }
                    } 

                    controller.enqueue(value);
                }
                controller.close();
            }catch(e){
                if (e instanceof ServiceError) {
                    controller.error(e);
                } else {
                    controller.error(new ServiceError("Stream interrupted", ServiceType.CHAT_AI, 500));
                }
            }
        },cancel(){
            stream.cancel();
        }
    });
}

async function getContext(prompt:string, uploadId:number, userId:number):Promise<string>{
    const {vectors} = await  pyClient.generateVector(prompt);
    return await similaritySearch(vectors, uploadId, userId);
}