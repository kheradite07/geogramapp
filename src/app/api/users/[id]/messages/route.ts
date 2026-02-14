import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = id;

    try {
        const messages = await prisma.message.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Map to frontend format
        const mappedMessages = messages.map(msg => ({
            id: msg.id,
            text: msg.content,
            lat: msg.latitude,
            lng: msg.longitude,
            timestamp: msg.createdAt.getTime(),
            userId: msg.userId,
            userName: msg.authorName,
            userImage: msg.authorImage || undefined,
            visibility: msg.visibility
        }));

        return NextResponse.json(mappedMessages);
    } catch (error) {
        console.error("Error fetching user messages:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
