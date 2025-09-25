import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import z, { date } from "zod";



//GET all the papers tied to the user.
export async function GET(){
    const user = await getSessionUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status : 401});
    try{
        const papers = await prisma.paper.findMany({
        where: {
            user_id: user.user_id
            }
        })
        console.log(user.user_id)
        console.log(papers)
        return NextResponse.json({papers});
    }catch(error: any){
        console.log(error)
        return NextResponse.json( { error:"Internal Server error" }, {status: 500});
    }
}

//Add a new paper tied to the user.

const addPaperSchema = z.object({
  name: z.string(),
  descr: z.string(),
  code: z.string(),
});
export async function POST(req: Request){
    const user = await getSessionUser();
    if(!user) return NextResponse.json({ error:"Unauthorized" }, {status : 401});
    console.log(user.user_id)
    //Validate input
    const body = await req.json();
    //console.log(body)
    const result = addPaperSchema.safeParse(body)
    //console.log(result)
    if(!result.success){
        return NextResponse.json({error: z.treeifyError(result.error).errors, status: 400})
    }
    const validatedInput = result.data
    console.log(result)
    if(!validatedInput){
        return NextResponse.json({error: "Internal Server error", status:500})
    }
    console.log(validatedInput)

    try{
        console.log(validatedInput)
        const papers = await prisma.paper.create({
            data:{
                user_id: user.user_id,
                name: validatedInput.name,
                filename:"",
                code: validatedInput.code,
                description: validatedInput.descr,
                }
        
        });
        console.log(validatedInput)
        return NextResponse.json({papers});
    }catch(error: any){
        return NextResponse.json( { error:"Internal Server error" }, {status: 500});
    }
}