import { queryLLMChat, queryLLMChatStream } from "../utils/ai-gateway";
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
    return queryLLMChatStream(systemPrompt, history, {type:ServiceType.CHAT_AI});
}