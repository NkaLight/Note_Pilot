import { NextRequest, NextResponse } from "next/server";
import { sendResetLink } from "@/lib/services/magicLink";
import { createPasswordResetToken } from "@/lib/services/reset_password";
import z, { ZodError } from "zod";

const emailSchema = z.object({
  email: z.email("Invalid Email format")
});

export async function POST(req:NextRequest){
    try{
        const data = await req.json();
        const validEmail = emailSchema.parse(data);
        const sessionToken = await createPasswordResetToken(validEmail.email);
        await sendResetLink(validEmail.email, sessionToken,);
    }catch(error){
        if(error instanceof ZodError){
            return NextResponse.json({error: error.flatten()}, {status:400});
        }
        console.error(error);
    }
    return NextResponse.json({message:"You should get an email if you are signed up with us."}, {status:200});
}