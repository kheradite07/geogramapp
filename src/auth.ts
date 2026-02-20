import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Credentials from "next-auth/providers/credentials"
import { OAuth2Client } from "google-auth-library"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
        Google,
        Apple,
        Credentials({
            id: "google-mobile",
            name: "Google Mobile",
            credentials: {
                idToken: { label: "ID Token", type: "text" }
            },
            async authorize(credentials) {
                console.log("---- GOOGLE MOBILE AUTH START ----");
                try {
                    const idToken = credentials.idToken as string
                    if (!idToken) throw new Error("No idToken provided")

                    const client = new OAuth2Client(process.env.AUTH_GOOGLE_ID)
                    const audiences = [process.env.AUTH_GOOGLE_ID!];
                    if (process.env.AUTH_GOOGLE_ANDROID_ID) {
                        audiences.push(process.env.AUTH_GOOGLE_ANDROID_ID);
                    }
                    console.log("Verifying token with Audiences:", audiences);

                    const ticket = await client.verifyIdToken({
                        idToken: idToken,
                        audience: audiences,
                    })
                    const payload = ticket.getPayload()
                    console.log("Token verified. Payload:", payload?.email);

                    if (!payload?.email) throw new Error("No email in token");

                    // Check if user exists
                    let user = await prisma.user.findUnique({
                        where: { email: payload.email }
                    });

                    // If not, create user
                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email: payload.email,
                                name: payload.name,
                                image: payload.picture,
                            }
                        });

                        // Create account link for consistency
                        await prisma.account.create({
                            data: {
                                userId: user.id,
                                type: "credentials",
                                provider: "google", // Pretend to be google provider
                                providerAccountId: payload.sub,
                            }
                        });
                    }

                    return user;
                } catch (error) {
                    console.error("Mobile Google Auth Error:", error);
                    return null;
                }
            }
        }),
        Credentials({
            id: "supabase",
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("---- SUPABASE AUTH START ----");
                try {
                    const email = credentials.email as string;
                    const password = credentials.password as string;

                    if (!email || !password) return null;

                    // Dynamically import supabase to avoid circular dependencies if any
                    const { supabase } = await import("@/lib/supabase");

                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (error || !data.user) {
                        console.error("Supabase Auth Error:", error?.message);
                        return null;
                    }

                    // Ensure user exists in Prisma DB (sync if necessary)
                    let user = await prisma.user.findUnique({
                        where: { email: data.user.email }
                    });

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email: data.user.email,
                                name: data.user.email?.split('@')[0],
                            }
                        });
                    }

                    return user;
                } catch (error) {
                    console.error("Supabase Credentials Auth Error:", error);
                    return null;
                }
            }
        }),
        Credentials({
            id: "supabase-token",
            name: "Supabase Token",
            credentials: {
                accessToken: { label: "Access Token", type: "text" }
            },
            async authorize(credentials) {
                console.log("---- SUPABASE TOKEN AUTH START ----");
                try {
                    const accessToken = credentials.accessToken as string;
                    if (!accessToken) return null;

                    const { supabase } = await import("@/lib/supabase");

                    // Verify token with Supabase
                    const { data: { user: sbUser }, error } = await supabase.auth.getUser(accessToken);

                    if (error || !sbUser) {
                        console.error("Supabase Token Verification Error:", error?.message);
                        return null;
                    }

                    // Ensure user exists in Prisma DB
                    let user = await prisma.user.findUnique({
                        where: { email: sbUser.email }
                    });

                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email: sbUser.email!,
                                name: sbUser.email?.split('@')[0],
                            }
                        });
                    }

                    return user;
                } catch (error) {
                    console.error("Supabase Token Auth Error:", error);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            return true;
        },
        async redirect({ url, baseUrl }) {
            // Allow relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allow callback URLs on the same origin
            if (new URL(url).origin === baseUrl) return url
            // Allow localhost explicitly to fix dev environment redirects
            if (url.includes("localhost") || url.includes("127.0.0.1")) return url
            return baseUrl
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        }
    },
    trustHost: true,
})
