// src/lib/auth.ts
/**
 * Auth/session helpers (server-side)
 *
 * WHAT IT DOES
 * - getAuthedUserId(): Reads the 'session_token' cookie, verifies the session against DB
 *   (not expired, not used), updates last_active_at, and returns the user_id or null.
 * - requireUserId(): Convenience wrapper that throws if no user is authenticated.
 * - getSessionUser(): Higher-level helper that calls your /api/validate_session endpoint
 *   to return { user_id, username, email } or null.
 *
 * IMPORTANT
 * - This version intentionally REMOVES any dev-bypass (AUTH_BYPASS).
 * - Keep SESSION_COOKIE in sync with sign-in/sign-out handlers.
 */

import { prisma } from "@/lib/db";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "session_token";
const JWT_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRETE);

export type SessionUser = {
  user_id: number;
  username: string;
  email: string;
  aiLevel?: string;
};

/**
 * Validate session gets the sessionUser at O(1) constant time from sessionCache
 */
export async function getSessionUser():Promise<SessionUser | any>{
  const cookieJar = await cookies();
  const token = cookieJar.get("session_token")?.value;
  if(!token) return null;
  try{
      const { payload } = await jwtVerify(token, JWT_SECRET); 
      return{
        user_id: payload.id, 
        email:payload.email,
        username: payload.username
      };
  }catch(error){
    console.error(error);
    return null;
  }
}

//  
export async function validatePaperId(paper_id: number):Promise<boolean | null>{
  const user = await getSessionUser();
  if(user.user_id === null) return null;

  const isValid = await prisma.paper.count({
    where:{
      paper_id:paper_id,
      user_id:user.user_id,
    }
  });
  if(isValid < 1) return null;
  return true;

}

