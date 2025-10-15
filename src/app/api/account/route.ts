export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getAuthedUserId } from "@/lib/auth"; // returns user ID or null

/**
 * API route for updating/deleting user account (Node runtime)
 * 
 * PUT: accepts JSON or multipart/form-data (for avatar).
 * Updates application_user (username/email/password[hashed]).
 * Upserts preferences (learner_style via aiLevel mapping, dark_mode).
 * Returns JSON only; validates content type to avoid HTML error pages.
 * Demo: avatar processed to data URL (replace with cloud storage later).
 * 
 * DELETE: (wire as needed) deletes account/session; returns JSON.
 * 
 * Notes:
 * 
 * Always respond with JSON to keep client robust (no Unexpected token '<').
 */


const uiToDbLevel: Record<string, string> = {
    child: "early",
    student: "intermediate",
    advanced: "advanced",
};
const dbToUiLevel: Record<string, string> = {
    early: "child",
    intermediate: "student",
    advanced: "advanced",
};

/**
 * Updates username, password, preferneces, etc. using prisma.
 * @param req JSON/form datas
 * @returns JSON
 */
export async function PUT(req: NextRequest) {
    const userId = await getAuthedUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const isMultipart = (req.headers.get("content-type") || "").includes("multipart/form-data");

        let username: string | undefined;
        let email: string | undefined;
        let password: string | undefined;
        let aiLevel: string | undefined;
        let darkMode: boolean | undefined;
        let avatarUrl: string | undefined; // returned to client

        if (isMultipart) {
            const form = await req.formData();

            username = form.get("username")?.toString();
            email = form.get("email")?.toString();
            password = form.get("password")?.toString();
            aiLevel = form.get("aiLevel")?.toString();
            darkMode = form.get("darkMode") === "true";

            const avatar = form.get("avatar") as File | null;
            if (avatar) {
                // Basic checks
                if (!avatar.type.startsWith("image/")) {
                    throw new Error("Invalid image type");
                }
                if (avatar.size > 5 * 1024 * 1024) {
                    throw new Error("Image too large (max 5MB)");
                }

                // DEMO storage: convert to data URL and return (no disk/cloud write)
                const buf = Buffer.from(await avatar.arrayBuffer());
                avatarUrl = `data:${avatar.type};base64,${buf.toString("base64")}`;

                // In production: upload buf to S3/Cloudinary and set avatarUrl to the hosted URL
            }
        } else {
            const json = await req.json();
            username = json.username;
            email = json.email;
            password = json.password;
            aiLevel = json.aiLevel;
            darkMode = Boolean(json.darkMode);
        }

        // Update user fields
        const updatedUser = await prisma.application_user.update({
            where: { user_id: userId },
            data: {
                username: username || undefined,
                email: email || undefined,
                password: password ? await bcrypt.hash(password, 10) : undefined,
                // later add avatar_url column, write it here:
                // avatar_url: avatarUrl ?? undefined,
            },
        });

        // Upsert preferences (ai level + dark mode)
        const prefs = await prisma.preferences.upsert({
            where: { user_id: userId },
            create: {
                user_id: userId,
                learner_style: aiLevel ? uiToDbLevel[aiLevel] : undefined,
                dark_mode: typeof darkMode === "boolean" ? darkMode : undefined,
            },
            update: {
                learner_style: aiLevel ? uiToDbLevel[aiLevel] : undefined,
                dark_mode: typeof darkMode === "boolean" ? darkMode : undefined,
            },
        });

        return NextResponse.json({
            user: {
                id: updatedUser.user_id,
                username: updatedUser.username,
                email: updatedUser.email,
                aiLevel: prefs.learner_style ? dbToUiLevel[prefs.learner_style] : "student",
                darkMode: !!prefs.dark_mode,
                avatarUrl, // for now, data URL (preview only)
            },
        });
    } catch (err: any) {
        console.error("PUT /api/account error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 400 });
    }
}
