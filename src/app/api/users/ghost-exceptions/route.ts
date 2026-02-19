import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { targetUserId, action } = await req.json();

        if (!targetUserId || !['add', 'remove'].includes(action)) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, ghostExceptions: true }
        }) as any;

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let exceptions = JSON.parse(user.ghostExceptions || "[]") as string[];

        if (action === 'add') {
            if (!exceptions.includes(targetUserId)) {
                exceptions.push(targetUserId);
            }
        } else {
            exceptions = exceptions.filter(id => id !== targetUserId);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                ghostExceptions: JSON.stringify(exceptions)
            }
        });

        return NextResponse.json({ success: true, exceptions });
    } catch (error) {
        console.error("Error updating ghost exceptions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
