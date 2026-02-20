import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // Detect origin robustly (Priority: X-Forwarded-Host -> Origin -> Referer -> .env -> Production)
        const forwardedHost = request.headers.get('x-forwarded-host');
        const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
        const originHeader = request.headers.get('origin');
        const refererHeader = request.headers.get('referer');

        let detectedOrigin = "";

        if (forwardedHost) {
            detectedOrigin = `${forwardedProto}://${forwardedHost}`;
        } else if (originHeader && originHeader !== 'null') {
            detectedOrigin = originHeader;
        } else if (refererHeader) {
            try {
                const refUrl = new URL(refererHeader);
                detectedOrigin = `${refUrl.protocol}//${refUrl.host}`;
            } catch (e) {
                detectedOrigin = process.env.NEXTAUTH_URL || 'https://geogramapp.vercel.app';
            }
        } else {
            detectedOrigin = process.env.NEXTAUTH_URL || 'https://geogramapp.vercel.app';
        }

        // Final cleanup
        const baseOrigin = detectedOrigin.replace(/\/$/, '');
        const redirectTo = `${baseOrigin}/auth/callback`;

        console.log("---- Auth Registration Debug ----");
        console.log("Forwarded Host:", forwardedHost);
        console.log("Origin Header:", originHeader);
        console.log("Referer Header:", refererHeader);
        console.log("Final Redirect URL:", redirectTo);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo,
            },
        });

        if (error) {
            console.error("Registration error:", error);
            // Handle existing user case specifically for better UX
            if (error.message.toLowerCase().includes("already registered")) {
                return NextResponse.json({ error: "email_already_exists" }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            message: "Registration successful. Please check your email for verification link.",
            user: data.user
        });
    } catch (error) {
        console.error("Internal registration error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
