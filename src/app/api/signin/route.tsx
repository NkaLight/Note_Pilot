import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_POLICY, setAuthCookies} from "@/lib/utils/auth";
import { SignJWT } from "jose";


/**
 * API route for user sign-in.
 * Validate user credentials and create a session.
 */

// Define a schema using Zod for validating incoming login data
const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
});

/**
 * This function handles user sign-in.
 * @param request the request object containing email and password.
 * @returns the user object in JSON format.
 */
export async function POST(request: Request) {
    
  try {
    // Validate input data
    const body = await request.json();
    const parsed = signInSchema.safeParse(body);

    if(!parsed.success){
          return NextResponse.json(
            { errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
          ); 
        }
    const data = parsed.data;
    // Find user by email
    const user = await prisma.application_user.findUnique({
        where: {
            email: data.email
        },
    });

    // Use constant-time comparison through bcrypt
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate and store session storage in DB
    const token = await new SignJWT({id:user.user_id, email:user.email, username:user.username})
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(AUTH_POLICY.access_expiry) 
            .sign(AUTH_POLICY.getAccessSecret());

    const refresh_token = crypto.randomBytes(32).toString("hex");
    // Store session in DB
    await prisma.session.create({
      data: {
        user_id: user.user_id,
        token:refresh_token,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        last_active_at: new Date(),
      },
    });
    //Set http-only cookies
    await setAuthCookies(token,refresh_token);
    
    return NextResponse.json({ user: { id: user.user_id, email: user.email, username : user.username } });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
