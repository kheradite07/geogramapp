import { auth } from "@/auth";
import { messages, Message } from "@/lib/store";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const body = await request.json();
        const { text, lat, lng } = body;

        if (!text || typeof lat !== 'number' || typeof lng !== 'number') {
            return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400 });
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            text: text.slice(0, 50), // Limit length to 50 chars
            lat,
            lng,
            timestamp: Date.now(),
            userId: session.user.email || session.user.name || "anonymous", // distinct ID
            userName: session.user.name || "Anonymous",
            userImage: session.user.image || undefined,
            likes: 0,
            dislikes: 0,
            likedBy: [],
            dislikedBy: [],
        };

        messages.push(newMessage);

        // Cleanup old messages > 24h
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        while (messages.length > 0 && messages[0].timestamp < cutoff) {
            messages.shift();
        }

        return new Response(JSON.stringify(newMessage), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
}

export async function GET(request: Request) {
    // Return all messages for now (MVP)
    // Filter by bounds if query params provided later
    return new Response(JSON.stringify(messages), { status: 200 });
}
