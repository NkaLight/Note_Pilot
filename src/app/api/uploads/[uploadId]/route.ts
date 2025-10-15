import { getAuthedUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * API route to delete a specific upload by its ID.
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ uploadId: string }> }
) {
    try {
        // Get authenticated user
        const userId = await getAuthedUserId();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const uploadId = Number(resolvedParams.uploadId);
        if (isNaN(uploadId)) {
            return NextResponse.json({ error: "Invalid upload ID" }, { status: 400 });
        }

        // First, verify the upload exists and belongs to the user
        const upload = await prisma.upload.findFirst({
            where: {
                upload_id: uploadId
            },
            include: {
                paper: {
                    select: {
                        user_id: true
                    }
                }
            }
        });

        if (!upload) {
            return NextResponse.json({ error: "Upload not found" }, { status: 404 });
        }

        if (upload.paper.user_id !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Delete the upload (this will cascade delete related records due to DB constraints)
        await prisma.upload.delete({
            where: {
                upload_id: uploadId
            }
        });

        return NextResponse.json({
            success: true,
            message: "Upload deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting upload:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            success: false 
        }, { status: 500 });
    }
}
