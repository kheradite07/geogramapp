import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google,
        Apple,
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Prevent linking different accounts if session is active
            if (account?.provider === "google" && profile?.email && user?.email) {
                // If the user is already signed in (user.email exists and doesn't match new profile email)
                // NextAuth passes the current session user as `user` when linking.
                // If it's a fresh login/signup, `user` is the new user (so emails match).
                return user.email === profile.email;
            }
            return true;
        }
    }
})
