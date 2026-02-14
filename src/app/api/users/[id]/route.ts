import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { mapPrismaUserToFrontendUser } from "@/lib/userStore";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const userId = id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                friendsRequested: { include: { receiver: true } },
                friendsReceived: { include: { requester: true } }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const frontendUser = mapPrismaUserToFrontendUser(user);

        // Return only public info
        return NextResponse.json({
            id: frontendUser.id,
            name: frontendUser.name,
            fullName: frontendUser.fullName,
            username: frontendUser.username,
            image: frontendUser.image,
            // Keep friends count or similar if needed, but for now basic profile info is enough
            // Maybe strict mode: only public info
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
