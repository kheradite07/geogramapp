import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, username, bio, image, activeBadgeId } = body;

        // Validation
        if (name !== undefined && (name.length < 2 || name.length > 16)) {
            return NextResponse.json({ error: "Name must be between 2 and 16 characters." }, { status: 400 });
        }

        if (username !== undefined) {
            if (username.length < 3 || username.length > 16) {
                return NextResponse.json({ error: "Username must be between 3 and 16 characters." }, { status: 400 });
            }
            const usernameRegex = /^[a-z0-9.]+$/;
            if (!usernameRegex.test(username)) {
                return NextResponse.json({ error: "Username can only contain lowercase letters, numbers, and dots." }, { status: 400 });
            }

            // Uniqueness check for username
            const existing = await prisma.user.findUnique({ where: { username } });
            if (existing && existing.email !== session.user.email) {
                return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
            }
        }

        // Helper to update full name or just name
        const updateData: any = {};
        if (name !== undefined) {
            updateData.name = name;
            updateData.fullName = name;
        }
        if (username !== undefined) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;
        if (image !== undefined) updateData.image = image;
        if (activeBadgeId !== undefined) updateData.activeBadgeId = activeBadgeId;

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}
