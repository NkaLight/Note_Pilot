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

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "session_token";

export type SessionUser = {
  user_id: number;
  username: string;
  email: string;
};

/** Lowest-level: cookie → user_id, with DB validation and activity touch. */
export async function getAuthedUserId(): Promise<number | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sess = await prisma.session.findFirst({
    where: { token, is_used: false },
    select: { user_id: true, expires_at: true },
  });
  if (!sess) return null;

  if (sess.expires_at && sess.expires_at < new Date()) return null;

  await prisma.session.updateMany({
    where: { token },
    data: { last_active_at: new Date() },
  });

  return sess.user_id;
}

/** Throws if not authenticated — handy for server actions or API routes. */
export async function requireUserId(): Promise<number> {
  const id = await getAuthedUserId();
  if (!id) throw new Error("Unauthorized");
  return id;
}

/**
 * Higher-level: return the full user object using your validation API.
 * Expects /api/validate_session to return { user: { user_id, username, email } } on success.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionToken = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/validate_session`, {
      headers: { Cookie: `${SESSION_COOKIE}=${sessionToken}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    return (data?.user ?? null) as SessionUser | null;
  } catch (err) {
    console.error("Error validating session:", err);
    return null;
  }
}