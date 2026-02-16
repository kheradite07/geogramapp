import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = session.user.email;
    // ... comments ...

    let targetUserId = decodeURIComponent(id);
    // If targetUserId looks like an email, we might need to find the user first. 
    // But since `search` returns `id` from Prisma, it should be the CUID.

    const { action } = await req.json(); // 'send', 'accept', 'reject', 'remove', 'cancel'

    try {
        // Ensure both users exist
        const currentUser = await prisma.user.findUnique({ where: { email: currentUserId } });
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        switch (action) {
            case 'send':
                // Check if friendship already exists
                const existing = await prisma.friendship.findFirst({
                    where: {
                        OR: [
                            { requesterId: currentUser.id, receiverId: targetUser.id },
                            { requesterId: targetUser.id, receiverId: currentUser.id }
                        ]
                    }
                });

                if (existing) {
                    if (existing.status === 'accepted') {
                        return NextResponse.json({ error: "Already friends" }, { status: 400 });
                    }
                    if (existing.requesterId === currentUser.id) {
                        return NextResponse.json({ error: "Request already sent" }, { status: 400 });
                    }
                    // If existing request from target, auto-accept
                    if (existing.requesterId === targetUser.id && existing.status === 'pending') {
                        await prisma.friendship.update({
                            where: { id: existing.id },
                            data: { status: 'accepted' }
                        });
                        return NextResponse.json({ success: true, status: 'accepted' });
                    }
                } else {
                    // Create new request
                    const newFriendship = await prisma.friendship.create({
                        data: {
                            requesterId: currentUser.id,
                            receiverId: targetUser.id,
                            status: 'pending'
                        }
                    });

                    // Send push notification to target user
                    const { sendNotificationToUser } = await import("@/lib/notifications");
                    await sendNotificationToUser(
                        targetUser.id,
                        "New Friend Request",
                        `${currentUser.name || currentUser.username || "Someone"} sent you a friend request.`,
                        {
                            type: 'friend_request',
                            friendshipId: newFriendship.id,
                            requesterId: currentUser.id
                        }
                    );
                }
                break;

            case 'accept':
                // Find pending request from target
                const requestToAccept = await prisma.friendship.findFirst({
                    where: {
                        requesterId: targetUser.id,
                        receiverId: currentUser.id,
                        status: 'pending'
                    }
                });

                if (!requestToAccept) {
                    return NextResponse.json({ error: "No pending request found" }, { status: 404 });
                }

                await prisma.friendship.update({
                    where: { id: requestToAccept.id },
                    data: { status: 'accepted' }
                });
                break;

            case 'reject':
            case 'cancel':
            case 'remove':
                // Find any relationship
                const relation = await prisma.friendship.findFirst({
                    where: {
                        OR: [
                            { requesterId: currentUser.id, receiverId: targetUser.id },
                            { requesterId: targetUser.id, receiverId: currentUser.id }
                        ]
                    }
                });

                if (relation) {
                    await prisma.friendship.delete({
                        where: { id: relation.id }
                    });
                }
                break;

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Friend Action Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
