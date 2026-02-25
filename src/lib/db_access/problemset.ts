import { prisma } from "@/lib/db";
import { DbError } from "../error";

export async function getProblemSet(uploadId:number, userId:number){
    try{
        return await prisma.problem_set.findFirst({
            where:{
                upload_id:uploadId,
                upload:{
                    paper:{
                        user_id:userId
                    }
                }
            },
            include:{
                upload:true,
                problem:true,
            }
        });
    }catch(error){
        console.error(error);
        throw new DbError("Error retrieving problemset DbError");
    }
}

export async function addProblemSet(uploadId:number, userId:number, questions:{ question: string, answer: string }[]){
    try{
        return await prisma.$transaction(async (tx)=>{
            // 1. Verify ownership/existence first
            const upload = await tx.upload.findFirst({
                where: {
                    upload_id: uploadId,
                    paper:{
                        user_id:userId
                    },
                }
            });
            if (!upload) {// I could return 404 not found yeah maybe.  
                return;
            }
            // 2. Clear old problems using the ID from the set that points to this upload
            if (upload.problem_set) {
                await tx.problem.deleteMany({
                    where: { pset_id: upload.problem_set.pset_id }
                });
            }

            return await tx.problem_set.upsert({
                where:{
                    upload_id:uploadId
                },
                update:{
                    text_data:`Updated the problem set at: ${new Date().toISOString()}`,
                    problem:{
                        deleteMany:{},
                        create:questions.map((q)=>({
                            question_text:q.question,
                            answer_text:q.answer
                        }))
                    }
                },
                create:{
                    upload:{
                        connect:{
                            upload_id:uploadId,
                        }
                    },
                    text_data:`Created at ${new Date().toISOString()}`,
                    problem:{
                        create: questions.map((q)=>({
                            question_text:q.question,
                            answer_text:q.answer
                        }))
                    }
                },
                include: { problem: true },
            });
        });
    }catch(error){
        console.error(error);
        throw new DbError("Error adding to problemset");
    }
}