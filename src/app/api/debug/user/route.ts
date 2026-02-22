import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !isAdmin(session.user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action, value } = await request.json();
        const userEmail = session.user.email as string;

        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === 'setPremium') {
            const updatedUser = await prisma.user.update({
                where: { email: userEmail },
                data: { isPremium: !!value }
            });
            return NextResponse.json({ success: true, isPremium: updatedUser.isPremium });
        }

        if (action === 'resetDailyLimit') {
            // "Reset" by moving today's posts to yesterday
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const result = await prisma.message.updateMany({
                where: {
                    userId: user.id,
                    createdAt: { gte: startOfDay }
                },
                data: {
                    createdAt: yesterday
                }
            });

            return NextResponse.json({ success: true, moved: result.count });
        }

        if (action === 'resetLevel') {
            const updatedUser = await prisma.user.update({
                where: { email: userEmail },
                data: {
                    xp: 0,
                    level: 1
                }
            });
            return NextResponse.json({ success: true, level: updatedUser.level, xp: updatedUser.xp });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Debug API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
