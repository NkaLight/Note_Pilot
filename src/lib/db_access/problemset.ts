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

export async function addProblemSet(uploadId: number, userId: number, questions: { question: string, answer: string }[]) {
    try {
        return await prisma.$transaction(async (tx) => {
            // 1. Ownership Check
            const upload = await tx.upload.findFirst({
                where: { upload_id: uploadId, paper: { user_id: userId } },
                select: { upload_id: true }
            });

            if (!upload) throw new Error("Unauthorized");

            // 2. Ensure ProblemSet exists (Upsert without the nested problems)
            const pSet = await tx.problem_set.upsert({
                where: { upload_id: uploadId },
                update: { text_data: `Updated: ${new Date().toISOString()}` },
                create: { 
                    upload_id: uploadId, 
                    text_data: `Created: ${new Date().toISOString()}` 
                },
            });

            // 3. Clean and Bulk Insert (Faster than nested create)
            await tx.problem.deleteMany({ where: { pset_id: pSet.pset_id } });
            
            await tx.problem.createMany({
                data: questions.map(q => ({
                    pset_id: pSet.pset_id,
                    question_text: q.question,
                    answer_text: q.answer
                }))
            });
            return pSet;
        }, { timeout: 10000 }); // Bonus: give it 10s just in case
    } catch (error) {
        console.error(error);
        throw error;
    }
}