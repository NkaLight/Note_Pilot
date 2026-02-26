import { parsedType } from "zod/v4/locales/en.cjs";
import { addProblemSet, getProblemSet } from "../db_access/problemset";
import { getSourceText } from "../db_access/upload";
import { ServiceType, DbError, ServiceError } from "../error";
import { queryLLM } from "../utils/ai-gateway";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function getQuestionsWithAnswers(uploadId:number, userId:number){
    const problemsets = await getProblemSet(uploadId, userId);
    if(problemsets){
                                                //Ignore the problem warning
        const questionsWithAnswers = problemsets.problem.map((problem, index) => ({
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

export async function evaluateAnswer(question, answer, userAnswer){
    const evaluationPrompt = `
            You are an exam evaluator. Compare the student's answer with the correct answer and provide constructive feedback.
            
            Return your response as valid JSON in this exact format:
            {
                "feedback": "Detailed feedback explaining what was good and what could be improved...",
                "score": 0.85
            }
            
            The score should be between 0 and 1, where 1 is perfect.
            
            Question: ${question}
            Correct Answer: ${answer}
            Student Answer: ${userAnswer}
            `;
    const systemPrompt = "You are an AI that outputs JSON only.";
    const jsonText = await queryLLM(systemPrompt, evaluationPrompt, {type:ServiceType.AI_GENERATION});
    try{
        const parsed = JSON.parse(jsonText);
        return{
            feedback: parsed.feedback || "Unable to generate feedback", 
            score: parsed.score || 0 
        };
    }catch(err){
        if (err instanceof ServiceError || err instanceof DbError) throw err;
        throw new ServiceError("Invalid AI response format", ServiceType.AI_GENERATION);
    }

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
    // 3. Parse & Persist
    console.error(jsonText);
  try {
    console.error(jsonText);
    const parsed = JSON.parse(jsonText);
    console.error("PARSED DATA before we pass to addProblemtSet currently throwing an error", parsed);
    const {pSet, questions} = await addProblemSet(uploadId,userId, parsed);

    // Transform to Frontend Format
    return {
      problemSetId: null,
      questions: parsed.map(p => ({
        question: p.question,
        answer: p.answer,
        userAnswer: "",
        userAnswerId: null
      }))
    };
  } catch (err) {
    if (err instanceof ServiceError || err instanceof DbError) throw err;
    console.error(err);
    throw new ServiceError("Invalid AI response format", ServiceType.AI_GENERATION);
  }
}
