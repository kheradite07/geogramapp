import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mapUserSafe } from "@/lib/userStore";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    try {
        const session = await auth();

        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { isAnonymous } = await req.json();

        // Validate inputs
        if (typeof isAnonymous !== 'boolean') {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: { isAnonymous }
        });

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(mapUserSafe(updatedUser));
    } catch (error) {
        console.error("Error updating user anonymity:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
