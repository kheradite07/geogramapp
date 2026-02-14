import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    const searchTerm = query.toLowerCase();

    // Filter users by username, fullName or name, excluding current user
    const users = await prisma.user.findMany({
        where: {
            AND: [
                { email: { not: session.user.email } },
                {
                    OR: [
                        { username: { contains: searchTerm } },
                        { fullName: { contains: searchTerm } },
                        { name: { contains: searchTerm } }
                    ]
                }
            ]
        },
        take: 10,
        select: {
            id: true,
            name: true,
            fullName: true,
            username: true,
            image: true
        }
    });

    const results = users.map(u => ({
        id: u.id,
        name: u.fullName || u.name || "Unknown", // Prefer full name
        username: u.username,
        image: u.image
    }));

    return NextResponse.json(results);
}
