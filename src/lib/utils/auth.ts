// lib/util/auth.ts
import crypto from "crypto";
export async function getRandomBytesHex(byteLength=32){
    return crypto.randomBytes(byteLength).toString("hex");
}
export const AUTH_POLICY = {
    getAccessSecret: () => {
        const secret = process.env.ACCESS_TOKEN_SECRETE;
        if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not defined in environment variables");
        return new TextEncoder().encode(secret);
    },
    // Human-readable for JWT (jose)
    access_expiry: "15m",
    refresh_expiry: "7d",
    
    // Exact milliseconds for JS Date/Prisma
    // 7 days * 24h * 60m * 60s * 1000ms
    refresh_ms: 7 * 24 * 60 * 60 * 1000, 
    
    // Centralized Secrets
    secrets: {
        access: new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRETE),
        refresh: new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRETE),
    },
    
    // Cookie Policies
    cookie: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
    }
};