import { getAuthedUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        // Get authenticated user
        const userId = await getAuthedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get paperId from query parameters
        const { searchParams } = new URL(request.url);
        const paperId = searchParams.get('paperId');
        
        if (!paperId) {
            return NextResponse.json({ error: "Paper ID is required" }, { status: 400 });
        }

        const paperIdNum = Number(paperId);
        if (isNaN(paperIdNum)) {
            return NextResponse.json({ error: "Invalid paper ID" }, { status: 400 });
        }

        // Verify the paper belongs to the authenticated user
        const paper = await prisma.paper.findFirst({
            where: {
                paper_id: paperIdNum,
                user_id: userId
            }
        });

        if (!paper) {
            return NextResponse.json({ error: "Paper not found or unauthorized" }, { status: 404 });
        }

        // Fetch all uploads for this paper
        const uploads = await prisma.upload.findMany({
            where: {
                paper_id: paperIdNum
            },
            select: {
                upload_id: true,
                filename: true,
                uploaded_at: true,
                text_content: true,
                file_type: true
            },
            orderBy: {
                uploaded_at: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            uploads: uploads
        });

    } catch (error) {
        console.error("Error fetching uploads:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            success: false 
        }, { status: 500 });
    }
}
