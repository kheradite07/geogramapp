import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text, lat, lng, visibility = 'public' } = await request.json();

        if (!text || typeof lat !== 'number' || typeof lng !== 'number') {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        // Get user for details
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const newMessage = await prisma.message.create({
            data: {
                content: text,
                latitude: lat,
                longitude: lng,
                userId: user.id,
                authorName: user.isAnonymous ? "Anonymous" : (user.fullName || user.name || "Unknown"),
                authorImage: user.isAnonymous ? null : (user.image || null),
                isAnonymous: user.isAnonymous,
                visibility
            }
        });

        return NextResponse.json(newMessage, { status: 201 });
    } catch (error) {
        console.error("Error posting message:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth();

        // Base query conditions
        const whereConditions: any = {
            // Delete old messages logic is handled by a cron/cleanup job usually, 
            // but for now we filter in query or let them be. 
            // Let's filter by time for performance if needed, 
            // but for now we follow the '24h' rule via created_at if we want strict compatibility,
            // or just return all for simplicity as per previous in-memory logic which had 24h limit.
            createdAt: {
                gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        };

        if (!session || !session.user || !session.user.email) {
            // Unauthenticated: Public only
            whereConditions.visibility = 'public';
        } else {
            // Authenticated: Public + Own + Friends
            // We need to fetch friends list first
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: {
                    friendsRequested: { where: { status: 'accepted' } },
                    friendsReceived: { where: { status: 'accepted' } }
                }
            });

            if (user) {
                const friendIds = [
                    ...user.friendsRequested.map(f => f.receiverId),
                    ...user.friendsReceived.map(f => f.requesterId)
                ];

                whereConditions.OR = [
                    { visibility: 'public' },
                    { userId: user.id },
                    {
                        AND: [
                            { visibility: 'friends' },
                            { userId: { in: friendIds } }
                        ]
                    }
                ];
            } else {
                // Fallback if user not found (shouldn't happen)
                whereConditions.visibility = 'public';
            }
        }

        const messages = await prisma.message.findMany({
            where: whereConditions,
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Map to frontend format if needed, but Prisma model is close enough.
        // We might need to adjust variable names if frontend expects different (e.g. lat/lng vs latitude/longitude)
        // Frontend expects: id, text, lat, lng, timestamp, userId, userName, userImage, visibility...

        const mappedMessages = messages.map(msg => ({
            id: msg.id,
            text: msg.content,
            lat: msg.latitude,
            lng: msg.longitude,
            timestamp: msg.createdAt.getTime(),
            userId: msg.userId,
            userName: msg.authorName,
            userImage: msg.authorImage || undefined,
            likes: msg.likes,
            dislikes: msg.dislikes,
            likedBy: JSON.parse(msg.likedBy || '[]'),
            dislikedBy: JSON.parse(msg.dislikedBy || '[]'),
            isAnonymous: msg.isAnonymous,
            visibility: msg.visibility
        }));

        return NextResponse.json(mappedMessages, { status: 200 });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
