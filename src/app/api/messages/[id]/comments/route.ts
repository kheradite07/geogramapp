import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/messages/[id]/comments - Fetch all comments for a message
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: messageId } = await params;

        const comments = await prisma.comment.findMany({
            where: {
                messageId
            },
            orderBy: {
                createdAt: 'asc' // Oldest first
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                userId: true,
                authorName: true,
                authorImage: true,
                isAnonymous: true
            }
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

// POST /api/messages/[id]/comments - Create a new comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id: messageId } = await params;
        const { content } = await request.json();

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Comment content is required" },
                { status: 400 }
            );
        }

        // Get current user
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                name: true,
                image: true,
                isAnonymous: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Verify message exists
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return NextResponse.json(
                { error: "Message not found" },
                { status: 404 }
            );
        }

        // Create comment
        const comment = await prisma.comment.create({
            data: {
                content: content.trim(),
                messageId,
                userId: user.id,
                authorName: user.name || "Unknown User",
                authorImage: user.image || undefined,
                isAnonymous: user.isAnonymous || false
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                userId: true,
                authorName: true,
                authorImage: true,
                isAnonymous: true
            }
        });

        // Send notification to message author if it's not the commenter
        if (message.userId && message.userId !== user.id) {
            const { sendNotificationToUser } = await import("@/lib/notifications");
            await sendNotificationToUser(
                message.userId,
                "New Comment",
                `${user.name || "Someone"} commented on your post: "${content.trim().substring(0, 50)}${content.trim().length > 50 ? '...' : ''}"`,
                {
                    type: 'comment',
                    messageId: messageId,
                    commentId: comment.id
                }
            );
        }

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Failed to create comment" },
            { status: 500 }
        );
    }
}
