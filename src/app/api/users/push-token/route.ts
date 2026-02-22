import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

// GET /api/users/push-token - Get current user's tokens (Admins can see others via ?userId=...)
export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const isAdminUser = isAdmin(session.user.email);

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Authorization: Only admin can see other users' tokens
        const userIdToFetch = (targetUserId && isAdminUser) ? targetUserId : currentUser.id;

        const tokens = await prisma.pushToken.findMany({
            where: { userId: userIdToFetch },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(tokens);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/users/push-token - Register/Update a token
export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, platform } = await req.json();

    const allowedPlatforms = ["android", "ios", "web"];
    if (!token || !platform || !allowedPlatforms.includes(platform)) {
        return NextResponse.json({ error: "Invalid token or platform metadata" }, { status: 400 });
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Security Check: If token exists, who owns it?
        const existingToken = await prisma.pushToken.findUnique({
            where: { token }
        });

        const isAdminUser = isAdmin(session.user.email);

        // If token exists and belongs to someone else, only allow takeover if Admin
        if (existingToken && existingToken.userId !== currentUser.id && !isAdminUser) {
            console.warn(`[SECURITY] Push token hijacking attempt detected! User ${currentUser.id} tried to claim token belonging to ${existingToken.userId}`);
            return NextResponse.json({ error: "Token already registered to another account." }, { status: 403 });
        }

        // Safe to upsert (reassign if same user or admin)
        // We do NOT update the 'platform' on update - it's immutable once created for a token
        await prisma.pushToken.upsert({
            where: { token },
            update: {
                userId: currentUser.id,
                updatedAt: new Date()
                // platform is not updated here to prevent metadata tampering
            },
            create: {
                token,
                platform,
                userId: currentUser.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/users/push-token - Unregister a specific token
export async function DELETE(req: Request) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const isAdminUser = isAdmin(session.user.email);

        // Find the token
        const existingToken = await prisma.pushToken.findUnique({
            where: { token }
        });

        if (!existingToken) return NextResponse.json({ success: true }); // Already gone

        // Authorization: Only owner or admin can delete
        if (existingToken.userId !== currentUser.id && !isAdminUser) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.pushToken.delete({ where: { token } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
