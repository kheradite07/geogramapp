import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkAndGrantBadges } from "@/lib/badgeLogic";
import { mapMessage } from "@/lib/messages";

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

        // Daily Post Limit Logic (For Non-Premium Users)
        if (!user.isPremium) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const postsToday = await prisma.message.count({
                where: {
                    userId: user.id,
                    createdAt: {
                        gte: startOfDay
                    }
                }
            });

            if (postsToday >= 3) {
                // Calculate time until next midnight
                const now = new Date();
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                const timeRemainingMs = tomorrow.getTime() - now.getTime();

                // Format nicely (e.g. "4h 20m")
                const hours = Math.floor(timeRemainingMs / (1000 * 60 * 60));
                const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));

                return NextResponse.json({
                    error: "Daily post limit reached",
                    isPremiumCallback: true,
                    resetTime: `${hours}h ${minutes}m`
                }, { status: 403 });
            }
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

        // XP & Leveling Logic
        // 5. Update User XP & Level (Gamification)
        const xpGain = 5; // Default XP per post
        const newXP = (user.xp || 0) + xpGain;

        // Import game logic dynamically or use helper
        // Since we are in same project, direct import is fine but let's check level
        // Simulating import here as replace_file context needs full
        const { getLevelFromXP } = await import("@/lib/gameLogic");

        const oldLevel = user.level || 1;
        const newLevel = getLevelFromXP(newXP);
        const hasLeveledUp = newLevel > oldLevel;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                xp: newXP,
                level: newLevel,
                lastLat: lat,
                lastLng: lng,
                lastSeen: new Date()
            }
        });

        // Badge Check
        const newlyEarned = await checkAndGrantBadges(user.id);

        // Fetch user again to have full relation for mapping
        const userForMapping = await prisma.user.findUnique({ where: { id: user.id } });

        // 6. Return success with updates
        return NextResponse.json({
            success: true,
            message: mapMessage({ ...newMessage, user: userForMapping }),
            userUpdates: {
                xp: newXP,
                level: newLevel,
                xpGain,
                earnedBadges: newlyEarned
            },
            levelUp: hasLeveledUp
        }, { status: 201 });
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
            take: 100,
            include: { user: true } // Fetch current user data
        });

        // Map to frontend format using current user data instead of snapshot
        const mappedMessages = messages.map(msg => mapMessage(msg));

        return NextResponse.json(mappedMessages, { status: 200 });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}

