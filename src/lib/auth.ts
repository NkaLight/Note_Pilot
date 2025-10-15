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
import { getUserFromToken } from "@/lib/session";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "session_token";

export type SessionUser = {
  user_id: number;
  username: string;
  email: string;
  aiLevel?: string;
};

/** Lowest-level: cookie → user_id, with DB validation and activity touch. */
export async function getAuthedUserId(): Promise<number | null> {
  const user = await getSessionUser();
  if(!user) return null;
  return user.user_id;
}

/** Throws if not authenticated — handy for server actions or API routes. */
export async function requireUserId(): Promise<number> {
  const id = await getAuthedUserId();
  if (!id) throw new Error("Unauthorized");
  return id;
}

/**
 * User object by using validateSession lib, since it fetches from cache first O(1) read, if not in cache then it fetches from DB.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieJar = await cookies();
  const token = cookieJar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return await getUserFromToken(token);
}

//  
export async function validatePaperId(paper_id: number){
  const user_id = await getAuthedUserId();
  if(user_id == null) return null;

  const isValid = await prisma.paper.count({
    where:{
      paper_id:paper_id,
      user_id:user_id,
    }
  })
  if(isValid < 1) return null;
  return true;

}

