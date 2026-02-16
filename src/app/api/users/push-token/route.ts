import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, platform } = await req.json();

    if (!token || !platform) {
        return NextResponse.json({ error: "Missing token or platform" }, { status: 400 });
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Upsert token to ensure it's linked to the current user
        // If token exists, update user association and timestamp
        await prisma.pushToken.upsert({
            where: { token },
            update: {
                userId: currentUser.id,
                platform,
                updatedAt: new Date()
            },
            create: {
                token,
                platform,
                userId: currentUser.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error registering push token:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
