import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lat, lng } = await req.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return NextResponse.json({ error: "Invalid location data" }, { status: 400 });
    }

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                lastLat: lat,
                lastLng: lng,
                lastSeen: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Location Update Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
