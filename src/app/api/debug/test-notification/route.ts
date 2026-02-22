import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { sendNotificationToUser } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user?.email || !isAdmin(session.user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, title, body, data } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        await sendNotificationToUser(
            userId,
            title || "Test Notification",
            body || "This is a test notification from the debug endpoint.",
            data || { type: 'test' }
        );

        return NextResponse.json({ success: true, message: "Notification request processed. Check server logs for details." });
    } catch (error) {
        console.error("Error in test-notification API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
