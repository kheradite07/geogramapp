import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mapMessage } from "@/lib/messages";
import { isAdmin } from "@/lib/admin";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        console.log("Vote API - Session:", JSON.stringify(session));

        if (!session || !session.user) {
            console.error("Vote API - Unauthorized: No session or user");
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action, unlimited } = body; // 'like' or 'dislike', unlimited flag

        if (!['like', 'dislike'].includes(action)) {
            return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
        }

        // Find the message in database
        const message = await prisma.message.findUnique({
            where: { id }
        });

        if (!message) {
            return new Response(JSON.stringify({ error: "Message not found" }), { status: 404 });
        }

        const userId = session.user.id;

        if (!userId) {
            return new Response(JSON.stringify({ error: "User ID missing" }), { status: 400 });
        }

        // Get current vote arrays (stored as JSON strings in SQLite)
        let likedBy = JSON.parse(message.likedBy || '[]') as string[];
        let dislikedBy = JSON.parse(message.dislikedBy || '[]') as string[];
        let likes = message.likes || 0;
        let dislikes = message.dislikes || 0;

        const isAdminUser = isAdmin(session.user.email);

        // Unlimited mode for admins only
        if (unlimited === true && isAdminUser) {
            if (action === 'like') {
                likes++;
            } else {
                dislikes++;
            }
        } else {
            // Enforce strict 1-vote mode for regular users
            const wasLiked = likedBy.includes(userId);
            const wasDisliked = dislikedBy.includes(userId);

            if (wasLiked) {
                likedBy = likedBy.filter(u => u !== userId);
                likes--;
            }

            if (wasDisliked) {
                dislikedBy = dislikedBy.filter(u => u !== userId);
                dislikes--;
            }

            // Apply new vote
            if (action === 'like' && !wasLiked) {
                likes++;
                likedBy = [...likedBy, userId];
            } else if (action === 'dislike' && !wasDisliked) {
                dislikes++;
                dislikedBy = [...dislikedBy, userId];
            }
        }

        // Update in database (convert arrays to JSON strings)
        const updatedMessage = await prisma.message.update({
            where: { id },
            data: {
                likes,
                dislikes,
                likedBy: JSON.stringify(likedBy),
                dislikedBy: JSON.stringify(dislikedBy)
            },
            include: { user: true } // Include user for mapping
        });

        // Send notification if a NEW vote was added (and not by the author)
        // We check if the count increased to determine if it was a new vote
        const isNewLike = action === 'like' && likes > (message.likes || 0);
        const isNewDislike = action === 'dislike' && dislikes > (message.dislikes || 0);

        if ((isNewLike || isNewDislike) && message.userId && message.userId !== userId) {
            const { sendNotificationToUser } = await import("@/lib/notifications");
            const voterName = session.user.name || "Someone";
            const title = isNewLike ? "New Like" : "New Dislike";
            const body = `${voterName} ${isNewLike ? "liked" : "disliked"} your post.`;

            await sendNotificationToUser(
                message.userId,
                title,
                body,
                {
                    type: 'vote',
                    messageId: id,
                    action: action
                }
            );
        }

        return new Response(JSON.stringify(mapMessage(updatedMessage)), { status: 200 });
    } catch (error) {
        console.error('Vote error:', error);
        return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
}
