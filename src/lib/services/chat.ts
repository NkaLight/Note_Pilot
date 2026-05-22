import { queryLLMStream, StreamChunk } from "../utils/ai-gateway";
import { getChatMessages, saveNewMessages } from "../db_access/chat_message";
import { ServiceError, ServiceType } from "../error";
import { getContextHyDE } from "./context";
import { SYSTEM_PROMPT_CHAT } from "../prompts/rules"; 

export async function streamChat(uploadId:number ,userId: number, userInput: string, paperId:number):Promise<ReadableStream>{
    const priorMessages = (await getChatMessages(uploadId, userId)).map(m=>({role:m.role as "user"|"assistant", content: m.content}));
    const {context, filteredHistory} = await getContextHyDE(userInput, paperId, userId, priorMessages);
    if (!context) {
        throw new ServiceError("Upload not found or access denied", ServiceType.CHAT_AI, 401);
    }
    const systemPrompt = SYSTEM_PROMPT_CHAT(context);
    const messages = [
        ...filteredHistory, 
        {"role": "user", "content": userInput}
    ];
    let LLMText = "";
    const stream = await queryLLMStream(systemPrompt, messages, {type:ServiceType.CHAT_AI});
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
                                await saveNewMessages(uploadId, userId, userInput, LLMText); 
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
