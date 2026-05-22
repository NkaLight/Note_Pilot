import { addProblemSet, getProblemSet } from "../db_access/problemset";
import { getSourceText } from "../db_access/upload";
import { ServiceType, DbError, ServiceError } from "../error";
import { queryLLMStream, queryLLM } from "../utils/ai-gateway";

export async function getQuestionsWithAnswers(uploadId:number, userId:number){
    const problemsets = await getProblemSet(uploadId, userId);
    if(problemsets){
        //Ignore the problem warning
        const questionsWithAnswers = problemsets.problem.map((problem) => ({
                id: problem.problem_id,
                question: problem.question_text,
                answer: problem.answer_text || "",
                userAnswer: "", 
                userAnswerId: null
            }));
        return questionsWithAnswers;
    }else{
        return null;
    }
}

export async function evaluateAnswerStream(question, answer, userAnswer):Promise<ReadableStream>{
    const evaluationPrompt = `
        Compare the student's answer with the correct answer and return JSON only.

        Rules:
        - If the student's answer is irrelevant or too vague, score 0.

        Return format:
        {
        "feedback": "...",
        "score": 0.85,
        "missed_concepts": ["concept1", "concept2"]
        }

        Question: ${question}
        Correct Answer: ${answer}
        Student Answer: ${userAnswer}
        `;
    const systemPrompt = "You are an AI that outputs JSON only. You are an automated evaluation system, not a person. Output factual, source-attributed assessments only";
    const stream = await queryLLMStream(systemPrompt, evaluationPrompt, {type:ServiceType.AI_GENERATION});
    return new ReadableStream({
        async start(controller){
            const reader = stream.getReader();
            try{
                while(true){
                    const {done, value} = await reader.read();
                    if(done){
                        break;
                    }
                    controller.enqueue(value);
                }
                controller.close();
            }catch(e){
                if(e instanceof ServiceError){
                    controller.error(e);
                }else{
                    controller.error(new ServiceError("Stream interrupted", ServiceType.CHAT_AI, 500));
                }
            }
        }, cancel(){
            stream.cancel();
        }
    });
}

export async function generateAndSaveProblems(uploadId:number, userId:number){
    const textContent = await getSourceText(uploadId, userId);
    const systemPrompt = "You are an AI that outputs JSON only.";
    const query = `You are an AI tutor. Generate 4–6 exam-style short answer questions based on the following lecture text. 
                    Each question must include:
                    1. "question": The question text.
                    2. "answer": The ideal answer for evaluation later.

                    Format your response as a JSON array, like:
                    "[
                        {"question": "What is polymorphism in OOP?", "answer": "The ability of objects to take many forms..."},
                        {"question": "...", "answer": "..."}
                    ]"

                    Content to analyze:
                    """${textContent.text_content}"""
                    `;
    const jsonText = await queryLLM(systemPrompt, query, {
                type: ServiceType.AI_GENERATION
            });
  try {
    const parsed = JSON.parse(jsonText);
    const {questions} = await addProblemSet(uploadId,userId, parsed);

    // Transform to Frontend Format
    return {
      problemSetId: null,
      questions: questions.map(p => ({
        question: p.question,
        answer: p.answer,
        userAnswer: "",
        userAnswerId: null
      }))
    };
  } catch (err) {
    if (err instanceof ServiceError || err instanceof DbError) throw err;
    throw new ServiceError("Invalid AI response format", ServiceType.AI_GENERATION);
  }
}
