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
        const { name, bio, image } = body;

        // Helper to update full name or just name
        const updateData: any = {};
        if (name !== undefined) updateData.name = name; // Name is often used as Full Name in NextAuth
        if (name !== undefined) updateData.fullName = name; // Sync fullName

        if (bio !== undefined) updateData.bio = bio;
        if (image !== undefined) updateData.image = image;

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
