import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { hideLocationFromFriends } = await request.json();

        if (typeof hideLocationFromFriends !== 'boolean') {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: { hideLocationFromFriends }
        });

        return NextResponse.json({ message: "Privacy settings updated" });
    } catch (error) {
        console.error("Error updating privacy settings:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
