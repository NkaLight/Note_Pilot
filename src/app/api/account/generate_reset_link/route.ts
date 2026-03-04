import { NextRequest, NextResponse } from "next/server";
import { sendResetLink } from "@/lib/services/magicLink";
import {createResetToken} from "@/lib/services/resetPassword";
import z from "zod";

const emailSchema = z.object({
  email: z.email(),
});

export async function POST(req:NextRequest){
    try{
        const {email} = await req.json();
        const validEmail = emailSchema.parse({email});
        const sessionToken = await createResetToken(validEmail.email);
        await sendResetLink(sessionToken, validEmail.email);
    }catch(error){
        console.error(error);
        //return NextResponse.json({erorr:"Internal server error"}, {status:500});
    }
    return NextResponse.json({message:"If you have an account with us you should receive the email"}, {status:200});
}