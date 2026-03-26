import { queryLLMStream, StreamChunk } from "../utils/ai-gateway";
import { getChatMessages, saveNewMessages } from "../db_access/chat_message";
import { ChatMessage } from "../utils/ai-gateway";
import { ServiceError, ServiceType } from "../error";
import { getSourceText } from "../db_access/upload";

export async function streamChat(uploadId:number ,userId: number, content: string):Promise<ReadableStream>{
    const uploadIdNum = Number(uploadId);
    const sourceText = await getSourceText(uploadIdNum, userId);
    if (!sourceText) {
        throw new ServiceError("Upload not found or access denied", ServiceType.CHAT_AI, 401);
    }
    const priorMessages = await getChatMessages(uploadIdNum, userId);

    const systemPrompt = sourceText
    ? `You are a helpful study assistant. 
        Use the following lecture material to
        answer questions:\n\n${sourceText.text_content}`
  : "You are a helpful study assistant.";

  let history: string =  priorMessages.map((m)=> m.content).join("");
  history += content;

    let LLMText = "";
    const stream = await queryLLMStream(systemPrompt, history, {type:ServiceType.CHAT_AI});
    return new ReadableStream({
        async start(controller){
            const reader = stream.getReader();
            const textCode = new TextDecoder();
            try{
                // eslint-disable-next-line no-constant-condition
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
                                await saveNewMessages(uploadId, userId, content, LLMText); 
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