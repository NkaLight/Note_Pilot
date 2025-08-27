import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma"; 
import { z } from "zod";  

// Define a schema for validating incoming login data
const signInSchema = z.object({
  email: z.string().email(),   // Email must be a valid email format
  password: z.string(), // Password must be at least 8 characters
});

export async function POST(request: Request) {
    
  try {
    const body = await request.json();
    const parsed = signInSchema.parse(body); // Validate the input against our schema
    const user = await prisma.application_user.findUnique({
        where: {
            email: parsed.email
        },
    })
    if(!user || user.password !== parsed.password){
        throw new Error(`Invalid credentials ${user}`);
    }
    if(user){
        console.log(user)
        return NextResponse.json({ user });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
