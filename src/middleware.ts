import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limit store (Note: This is per-instance in Edge/Serverless)
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

export function middleware(request: NextRequest) {
    // Only apply to API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'anonymous';
        const now = Date.now();

        const userData = rateLimitStore.get(ip) || { count: 0, lastReset: now };

        // Reset window if expired
        if (now - userData.lastReset > RATE_LIMIT_WINDOW) {
            userData.count = 0;
            userData.lastReset = now;
        }

        userData.count++;
        rateLimitStore.set(ip, userData);

        if (userData.count > MAX_REQUESTS) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/api/:path*',
};
