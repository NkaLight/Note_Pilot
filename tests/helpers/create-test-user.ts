import { BrowserContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AUTH_POLICY } from '@/lib/utils/auth';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_TEST } },
});

export async function createIsolatedUser(context: BrowserContext) {
  const uniqueId = crypto.randomBytes(4).toString('hex');
  const hashPassword = await bcrypt.hash('testPassword123', 10);
  const user = await prisma.application_user.create({
    data: {
      username: `user-${uniqueId}`,
      email: `test-${uniqueId}@test.com`,
      password: hashPassword,
    },
  });

  const accessToken = await new SignJWT({
    id: user.user_id,
    email: user.email,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(AUTH_POLICY.access_expiry)
    .sign(AUTH_POLICY.getAccessSecret());

  const refreshToken = crypto.randomBytes(32).toString('hex');

  await prisma.session.create({
    data: {
      user_id: user.user_id,
      token: refreshToken,
      expires_at: new Date(Date.now() + AUTH_POLICY.refresh_ms),
      last_active_at: new Date(),
    },
  });
  await context.addCookies([
    {
      name: 'refresh_token',
      value: refreshToken,
      domain: 'localhost',
      path: '/api/refresh_token',
      httpOnly: true,
      secure: false,
    },
    {
      name: 'session_token',
      value: accessToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
    },
  ]);

  return { user };
}

export async function cleanupUser(userId: number) {
  await prisma.session.deleteMany({ where: { user_id: userId } });
  await prisma.application_user.delete({where : {user_id:userId}});
}