import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
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

        // Bypass checks if unlimited
        if (unlimited === true) {
            if (action === 'like') {
                likes++;
                if (!likedBy.includes(userId)) {
                    likedBy = [...likedBy, userId];
                }
            } else {
                dislikes++;
                if (!dislikedBy.includes(userId)) {
                    dislikedBy = [...dislikedBy, userId];
                }
            }
        } else {
            // Remove existing votes (Strict 1-vote mode)
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
            }
        });

        return new Response(JSON.stringify(updatedMessage), { status: 200 });
    } catch (error) {
        console.error('Vote error:', error);
        return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
}
