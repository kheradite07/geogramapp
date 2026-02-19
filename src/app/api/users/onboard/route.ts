import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mapPrismaUserToFrontendUser } from "@/lib/userStore";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || !session.user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { username, fullName } = await request.json();

        // Validation: 16-character limits
        if (!username || username.length < 3 || username.length > 16) {
            return NextResponse.json({ error: "Username must be between 3 and 16 characters." }, { status: 400 });
        }

        // Format: English lowercase, numbers, and dots only
        const usernameRegex = /^[a-z0-9.]+$/;
        if (!usernameRegex.test(username)) {
            return NextResponse.json({ error: "Username can only contain lowercase English letters, numbers, and dots." }, { status: 400 });
        }

        if (!fullName || fullName.length < 2 || fullName.length > 16) {
            return NextResponse.json({ error: "Name must be between 2 and 16 characters." }, { status: 400 });
        }

        // Check if username is taken
        const existingUser = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUser && existingUser.email !== session.user.email) {
            return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
        }

        // Update User
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                username,
                fullName,
                isOnboarded: true
            },
            include: {
                friendsRequested: {
                    include: { receiver: true }
                },
                friendsReceived: {
                    include: { requester: true }
                }
            }
        });

        return NextResponse.json(mapPrismaUserToFrontendUser(updatedUser));
    } catch (error) {
        console.error("Onboarding Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
