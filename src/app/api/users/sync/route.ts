import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mapPrismaUserToFrontendUser } from "@/lib/userStore";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, image } = session.user;
    console.log("[SYNC] Session user:", email);

    // NextAuth adapter should have already created the user, but we ensure it exists and return it with relations
    // We use finding unique because NextAuth adapter handles creation on login
    let user = await prisma.user.findUnique({
        where: { email },
        include: {
            friendsRequested: { include: { receiver: true } },
            friendsReceived: { include: { requester: true } },
            badges: true
        }
    });

    console.log("[SYNC] DB User found:", !!user);
    if (user) console.log("[SYNC] User ID:", user.id);

    // Fallback if something went wrong or to ensure data consistency
    if (!user) {
        // This shouldn't theoretically happen with the adapter, but safe to handle
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
        const mappedData = mapPrismaUserToFrontendUser(user, user.id);
        console.log("[SYNC] Mapping successful");
        return NextResponse.json(mappedData);
    } catch (e) {
        console.error("[SYNC] Mapping failed:", e);
        return NextResponse.json({ error: "Mapping failed", detail: String(e) }, { status: 500 });
    }
}
