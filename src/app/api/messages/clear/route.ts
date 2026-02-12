import { NextResponse } from 'next/server';
import { clearAllMessages } from '@/lib/store';

export async function DELETE() {
    try {
        clearAllMessages();
        return NextResponse.json({ success: true, message: 'All messages cleared' });
    } catch (error) {
        console.error('Error clearing messages:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to clear messages' },
            { status: 500 }
        );
    }
}
