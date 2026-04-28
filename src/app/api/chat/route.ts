import { getSessionUser } from "@/lib/auth";
import {getChatMessages, clearChatMessages } from "@/lib/db_access/chat_message";
import { NextRequest, NextResponse } from "next/server";
import { streamChat } from "@/lib/services/chat";
import { z } from "zod";

/**
 * Chat API endpoints for persistent chat message management
 * 
 * WHAT IT DOES:
 * GET: Retrieve chat history for specific uploads
 * POST: Save new chat messages to database
 * DELETE: Clear chat history for specific uploads
 * Links chat messages to uploads and users for persistence
 */

// Validation schemas
const getChatSchema = z.object({
  uploadId: z.coerce.number(),
});

const postChatSchema = z.object({
  uploadId: z.number(),
  content: z.string(),
});

const deleteChatSchema = z.object({
  uploadId: z.coerce.number(),
});

export async function GET(request: NextRequest) {
  try {
    const {user} = await getSessionUser();
    const user_id = user.user_id;
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId");
    
    if (!uploadId) {
      return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
    }

    const parsed = getChatSchema.safeParse({ uploadId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid uploadId" }, { status: 400 });
    }

    // Fetch chat messages for this upload
    const messages = await getChatMessages(Number(uploadId), user_id);

    return NextResponse.json({
      success: true,
      messages: messages.map(msg => ({
        message_id: msg.message_id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at.toISOString()
      }))
    });

  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req:NextRequest){
  const {user, status} = await getSessionUser();
  if(status !== "ok"){
    return NextResponse.json({error:"Unauthenticated"}, {status:401});
  }
  const body = await req.json();
  const parsed = postChatSchema.safeParse(body);
  console.error(parsed);
  if(!parsed.success){
    return NextResponse.json({error: parsed.error.flatten()}, {status:400});
  }
  try{
    const chatResp = await streamChat(parsed.data.uploadId, user.user_id, parsed.data.content);
    return new Response(chatResp,{
      headers:{
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      }
    });
  }catch(error){
    console.error(error);
    return NextResponse.json({error:"Internal Server error"}, {status:500});
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const {user} = await getSessionUser();
    const user_id = user.user_id;
    if (!user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const uploadId = url.searchParams.get("uploadId");
    
    if (!uploadId) {
      return NextResponse.json({ error: "uploadId is required" }, { status: 400 });
    }

    const parsed = deleteChatSchema.safeParse({ uploadId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid uploadId" }, { status: 400 });
    }

    // Delete all chat messages for this upload and user
    const result = await clearChatMessages(Number(uploadId), user_id);
    return NextResponse.json({
      success: true,
      deletedCount: result.count
    });

  } catch (error) {
    console.error("Error clearing chat history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}