import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';

export async function DELETE() {
    try {
        const session = await auth();
        if (!session || !session.user || !isAdmin(session.user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete all messages using Prisma
        await prisma.message.deleteMany({});

        return NextResponse.json({ success: true, message: 'All messages cleared' });
    } catch (error) {
        console.error('Error clearing messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to clear messages' },
            { status: 500 }
        );
    }
}
