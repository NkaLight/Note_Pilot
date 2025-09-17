import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Validation schema for signup data
const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if(!result.success){
      return NextResponse.json(
        { errors: result.error.flatten().fieldErrors },
        { status: 400 }
      ); 
    }
    const validated = result.data
    if(!validated) return NextResponse.json({errors: "Internal Sever error"}, {status: 404}) // This should never happen I was shutting up Next.js, since validated could be undefined but I know that could never happen

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.application_user.create({
      data: {
        username: validated.username,
        email: validated.email,
        password: hashedPassword // Store hashed password
      },
    });

    // Don't send password back in response
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if(error.code ==  "P2002"){
        const target = (error.meta as any)?.target ?? "field";
        return NextResponse.json({ error: `A user with this ${target} already exists.`}, { status: 400 });
      }
    }
    return NextResponse.json({ error:"Registration failed" }, { status: 500 });
  }
}
