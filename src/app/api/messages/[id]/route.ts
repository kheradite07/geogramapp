import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the message and verify ownership
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Get current user from DB
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || message.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete dependent records first (votes etc. are cascaded from prisma schema, but comments may not be)
    await prisma.comment.deleteMany({ where: { messageId: id } });
    await prisma.message.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
