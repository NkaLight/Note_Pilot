import crypto from "crypto";
import { cookies } from "next/headers";

export async function getRandomBytesHex(byteLength=32){
    return crypto.randomBytes(byteLength).toString("hex");
}
export const AUTH_POLICY = {
    getAccessSecret: () => {
        const secret = process.env.ACCESS_TOKEN_SECRET;
        if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not defined in environment variables");
        return new TextEncoder().encode(secret);
    },
    // Human-readable for JWT (jose)
    access_expiry: "15m",
    refresh_expiry: "7d",
    
    // Exact milliseconds for JS Date/Prisma
    // 7 days * 24h * 60m * 60s * 1000ms
    refresh_ms: 7 * 24 * 60 * 60 * 1000, 
    
    // Cookie Policies
    cookie: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
    }
};
export const setAuthCookies = async (accessToken: string,refreshToken:string) => {
  const jar = await cookies();
  jar.set({
    name: "refresh_token",
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/api/refresh_token",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  jar.set({
    name:"session_token",
    value:accessToken, 
    httpOnly:true,
    secure:process.env.NODE_ENV === "production",
    path:"/",
    maxAge:60 * 15, // 15min
  });
};

export const setAccessToken = async (accessToken:string) =>{
    const jar = await cookies();
    jar.set({
    name:"session_token",
    value:accessToken, 
    httpOnly:true,
    secure:process.env.NODE_ENV === "production",
    path:"/",
    maxAge:60 * 15, // 15min
  });
};