// src/lib/auth.ts
/**
 * auth.ts
 * - Session helpers backed by Prisma.
 * - getAuthedUserId(): reads 'session_token' cookie, validates session (expiry/is_used), touches last_active_at.
 * - requireUserId(): convenience variant that throws if not authenticated.
 * - Keep cookie name in sync with your sign-in flow.
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

// Keep in sync with whatever you set on login
export const SESSION_COOKIE = "session_token";

/**
 * Returns the authenticated user's id from the session cookie, or null.
 * Also touches last_active_at. Checks expiry and is_used.
 */
export async function getAuthedUserId(): Promise<number | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sess = await prisma.session.findFirst({
    where: { token, is_used: false },
    select: { user_id: true, expires_at: true },
  });
  if (!sess) return null;

  if (sess.expires_at && sess.expires_at < new Date()) {
    return null;
  }

  await prisma.session.updateMany({
    where: { token },
    data: { last_active_at: new Date() },
  });

  return sess.user_id;
}

/** Helper if you prefer throwing */
export async function requireUserId(): Promise<number> {
  const id = await getAuthedUserId();
  if (!id) throw new Error("Unauthorized");
  return id;
}

type User = {
  email: string;
  username: string;
  user_id: number;
};

/* Function that validates session token*/
export async function getSessionUser(): Promise<User | null> {
  // Get the session token from the incoming request's cookies
  const sessionToken = (await cookies()).get('session_token')?.value;

  if (!sessionToken) {
    return null;
  }
  try {
    // Fetch from your validation API, including the cookies
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/validate_session`, {
      headers: {
        Cookie: `session_token=${sessionToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.user || null;
    }

    return null;
  } catch (err) {
    console.error('Error validating session:', err);
    return null;
  }
}


