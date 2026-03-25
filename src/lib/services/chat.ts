import { queryLLMChat, queryLLMChatStream, StreamChunk } from "../utils/ai-gateway";
import { getChatMessages, saveNewMessages } from "../db_access/chat_message";
import { ChatMessage } from "../utils/ai-gateway";
import { ServiceError, ServiceType } from "../error";
import { getSourceText } from "../db_access/upload";



export async function generateChat(sourceText:string, uploadId:number, userId:number, content:string){
    if(!uploadId || !userId) throw new ServiceError(`Invalid generateChat input ${uploadId} ${userId}`,ServiceType.AI_GENERATION);
    const priorMessages = await getChatMessages(uploadId, userId);

    const systemPrompt = sourceText
        ? `You are a helpful study assistant. 
           Use the following lecture material to
           answer questions:\n\n${sourceText}`
  : "You are a helpful study assistant.";

    const history: ChatMessage[] = [
        ...priorMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content },
        ];

    const reply = await queryLLMChat(systemPrompt, history, {type:ServiceType.CHAT_AI});
    return await saveNewMessages(uploadId, userId, content, reply); 
}
export async function streamChat(uploadId:number ,userId: number, content: string):Promise<ReadableStream>{
    const uploadIdNum = Number(uploadId);
    const sourceText = await getSourceText(uploadIdNum, userId);
    const priorMessages = await getChatMessages(uploadIdNum, userId);

    const systemPrompt = sourceText
    ? `You are a helpful study assistant. 
        Use the following lecture material to
        answer questions:\n\n${sourceText}`
  : "You are a helpful study assistant.";

  const history: ChatMessage[] = [
    ...priorMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content },
    ];

    let LLMText = "";
    const stream = await queryLLMChatStream(systemPrompt, history, {type:ServiceType.CHAT_AI});
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
                            if(parsed.type === "done"){
                                await saveNewMessages(uploadId, userId, content, LLMText); 
                            }
                        }catch{
                            //ignore
                        }
                    } 
                    controller.enqueue(value);
                }
                controller.close();
            }catch{
                controller.error("Stream interupted");
            }
        },cancel(){
            stream.cancel();
        }
    });
}