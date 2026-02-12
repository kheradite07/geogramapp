import { auth } from "@/auth";
import { messages } from "@/lib/store";

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

        const messageIndex = messages.findIndex((m) => m.id === id);
        if (messageIndex === -1) {
            return new Response(JSON.stringify({ error: "Message not found" }), { status: 404 });
        }

        const message = messages[messageIndex];
        const userId = session.user.email || session.user.name || "anonymous";

        // Bypass checks if unlimited
        if (unlimited === true) {
            if (action === 'like') {
                message.likes++;
                if (!message.likedBy.includes(userId)) {
                    message.likedBy.push(userId);
                }
            } else {
                message.dislikes++;
                if (!message.dislikedBy.includes(userId)) {
                    message.dislikedBy.push(userId);
                }
            }
            return new Response(JSON.stringify(message), { status: 200 });
        }

        // Remove existing votes (Strict 1-vote mode)
        const likedIndex = message.likedBy.indexOf(userId);
        if (likedIndex > -1) {
            message.likedBy.splice(likedIndex, 1);
            message.likes--;
        }

        const dislikedIndex = message.dislikedBy.indexOf(userId);
        if (dislikedIndex > -1) {
            message.dislikedBy.splice(dislikedIndex, 1);
            message.dislikes--;
        }

        // Apply new vote
        if (action === 'like') {
            if (likedIndex === -1) { // Only add if not already liked (toggle logic handled by frontend usually, but here strict set)
                // Actually standard toggle logic: if clicking like and already liked -> remove like. 
                // But for simplicity let's assume specific action intent. 
                // If I want to toggle, I should check if it was already liked.
                // Let's implement toggle logic based on current state vs action.
                // BUT simpler for API: Action 'like' means "I want this to be liked". 
                // Use a separate 'remove' action or just check current state?
                // Let's stick to: if you send 'like' and it's already liked, we do nothing or we toggle off?
                // Let's make it standard: POST 'like' adds like. If you want to remove, maybe a different endpoint or action 'unlike'?
                // Let's assume the frontend handles the "toggle" visual and sends "like" when it wants to like, and maybe "neutral" to remove?
                // Converting to strict state:

                message.likes++;
                message.likedBy.push(userId);
            }
        } else if (action === 'dislike') {
            if (dislikedIndex === -1) {
                message.dislikes++;
                message.dislikedBy.push(userId);
            }
        }

        return new Response(JSON.stringify(message), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
}
