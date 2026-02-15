import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Credentials from "next-auth/providers/credentials"
import { OAuth2Client } from "google-auth-library"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
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
                if (!credentials?.idToken) return null;

                try {
                    const client = new OAuth2Client(process.env.AUTH_GOOGLE_ID);
                    const ticket = await client.verifyIdToken({
                        idToken: credentials.idToken as string,
                        audience: process.env.AUTH_GOOGLE_ID,
                    });
                    const payload = ticket.getPayload();

                    if (!payload?.email) return null;

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
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Allow all sign-ins
            return true;
        }
    }
})
