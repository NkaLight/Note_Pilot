import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { SignJWT } from "jose";
import { AUTH_POLICY, setAuthCookies } from "@/lib/utils/auth";

/**
 * API route to handle user signup.
 * Validates input, hashes password, creates user and session, and sets a cookie.
 */

// Validation schema for signup data
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

/**
 * This function handles user signup requests
 * @param request the incoming request object containing user signup data
 * @returns a JSON response with user info
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if(!result.success){
      return NextResponse.json(
        { error: result.error.flatten().fieldErrors },
        { status: 400 }
      ); 
    }
    const validated = result.data;
    if(!validated) return NextResponse.json({error: "Internal Sever error"}, {status: 404});// This should never happen I was shutting up Next.js, since validated could be undefined but I know that could never happen

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.application_user.create({
      data:{
        email:validated.email,
        password:hashedPassword
      }
    });

    // Generate and store session storage in DB
     const token = await new SignJWT({
      id:user.user_id, 
      email:user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(AUTH_POLICY.access_expiry) 
      .sign(AUTH_POLICY.getAccessSecret());

    const refresh_token = crypto.randomBytes(32).toString("hex");
    
    // store refresh token in DB
    await prisma.session.create({
      data: {
        user_id: user.user_id,
        token:refresh_token,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        last_active_at: new Date(),
      }
    });
    
    //Store the token pairs
    await setAuthCookies(token, refresh_token);

    return NextResponse.json({ user: { id: user.user_id, email: user.email}});
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if(error.code ===  "P2002"){
        const target = (error.meta as any)?.target ?? "field";
        return NextResponse.json({ error: `A user with this ${target} already exists.`}, { status: 400 });
      }
    }
    console.error(error);
    return NextResponse.json({ error:"Registration failed" }, { status: 500 });
  }
}
