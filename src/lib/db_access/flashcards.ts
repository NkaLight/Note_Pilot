import { prisma } from "@/lib/db";
import type {Flashcard } from "../zod_schemas/flashcards";
import { NextResponse } from "next/server";
import { DbError } from "../error";

export async function getFlashCards(uploadId:number, user_id:number){
    try{
        return await prisma.flashcard.findMany({
        where: {
          flashcard_set: {
            upload_id: Number(uploadId),
            upload: {
              paper: { user_id: user_id },
            },
          },
        },
        orderBy: { flashcard_id: "asc" },
      });
    }catch(error){
        throw new DbError("Failed to fetch flashCards from DB");
    }
}
export async function createOrUpdateFlashCardSet(uploadId:number,flashcards:Flashcard [], sourceText:string){
    try{
        return await prisma.flashcard_set.upsert({
            where:{upload_id:uploadId},
            update:{
                text_data:sourceText,
                flashcard:{
                    deleteMany:{},
                    create:flashcards.map((fc)=>({
                        question_front:fc.question_front,
                        answer_back:fc.answer_back,
                    })),
                },
            },
            create:{
                upload_id:uploadId,
                text_data:sourceText,
                flashcard:{
                    create: flashcards.map((fc)=>({
                        question_front:fc.question_front,
                        answer_back:fc.answer_back
                    })),
                },
            },
            include:{flashcard:true},
        });
    }catch{
        throw new DbError("Failed to upsert flashCards from DB");
    }
}
