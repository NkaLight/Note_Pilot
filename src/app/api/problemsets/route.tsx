import { getAuthedUserId } from "@/lib/auth";
import { NextResponse } from "next/server";
import {getQuestionsWithAnswers, generateAndSaveProblems, evaluateAnswer} from "@/lib/services/problemset";
import { ServiceError, DbError } from "@/lib/error";

/**
 * API route for managing problem sets.
 * Supports:
 * - Generating exam-style questions (persistent)
 * - Storing user answers (persistent)
 * - Evaluating answers with feedback (temporary/not persistent)
 */

/**
 * GET function - Retrieve existing problem sets and user answers
 */
export async function GET(request: Request) {
    try {
        const userId = await getAuthedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const uploadId = searchParams.get("uploadId");
        if (!uploadId) {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }
        const questionsWithAnswers = await getQuestionsWithAnswers(Number(uploadId), userId); 

        if (questionsWithAnswers) {
            return NextResponse.json({ 
                success: true, 
                questions: questionsWithAnswers,
                cached: true
            });
        }
        console.error(questionsWithAnswers);
        return NextResponse.json({ success: true, questions: null });

    } catch (error) {
        console.error("Error fetching problem set:", error);
        return NextResponse.json({ error: "Failed to fetch problem set" }, { status: 500 });
    }
}

/**
 * POST function
 * @param req the request object containing mode, uploadIds, userAnswer, and questions.
 * @returns the generated questions, saved user answer, or evaluation feedback in JSON format.
 */
export async function POST(req: Request){
    try{
        const userId = await getAuthedUserId();
        if(!userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const {mode, uploadId, lectureId, userAnswer, questions, problemId, userAnswerId} = await req.json();
        console.log(mode, uploadId, lectureId, userAnswer, questions);

        if(!mode) {
            return NextResponse.json({error:"No mode selected"}, {status: 400});
        }

        // GENERATE QUESTIONS (Persistent)
        if(mode === "generate"){
            if(!uploadId) {
                return NextResponse.json({error:"At generate UploadId must be provided"}, {status: 400});
            }
            try{
                const {questions, problemSetId} = await generateAndSaveProblems(uploadId, userId);
                return NextResponse.json({questions: questions, problemSetId: problemSetId});
            } catch (err) {
                if(err instanceof DbError || err instanceof ServiceError){
                      console.error(`[${err.name}]: ${err.message}`,{
                        status:err.status,
                        stack:err.stack,
                        ...(err instanceof ServiceError &&{type: err.type})
                      });
                    }else{
                      console.error("[UNEXPECTED_EXCEPTION]:", err);
                    }
                return NextResponse.json({error:"Internal server error"}, {status:500});
            }
        // EVALUATE ANSWER (Temporary - Not Persistent)
        } else if(mode === "evaluate"){
            const {question, answer} = questions;

            if (!question || !answer || !userAnswer) {
                return NextResponse.json({error: "Question, answer, and user answer required"}, {status: 400});
            }
            try{
                const feedback = await evaluateAnswer(question, answer, userAnswer);
                return NextResponse.json({ 
                    feedback: feedback.feedback, 
                    score: feedback.score 
                });
            }catch(err){
                if(err instanceof DbError || err instanceof ServiceError){
                      console.error(`[${err.name}]: ${err.message}`,{
                        status:err.status,
                        stack:err.stack,
                        ...(err instanceof ServiceError &&{type: err.type})
                      });
                    }else{
                      console.error("[UNEXPECTED_EXCEPTION]:", err);
                    }
                return NextResponse.json({error:"Internal server error"}, {status:500});
            }
        } else {
            return NextResponse.json({error: "Invalid mode"}, {status: 400});
        }
    }catch(err: any){
        console.error("Error at /api/problemsets:", err);
        return NextResponse.json({error: "Internal server error"}, {status: 500});
    }
}