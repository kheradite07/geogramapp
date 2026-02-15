// This file is now just for type definitions as we moved to Prisma
// The actual data access logic is in the API routes using prisma client

import { Prisma } from "@prisma/client";

export interface User {
    id: string; // email as ID
    name: string;
    image?: string;

    // Custom Fields
    username?: string;
    fullName?: string;
    bio?: string;
    isOnboarded: boolean;
    isAnonymous: boolean;

    // Location
    lastLat?: number;
    lastLng?: number;
    lastSeen?: Date;

    // Privacy
    hideLocationFromFriends: boolean;
    level?: number;
    xp?: number;
    isPremium?: boolean;

    // Relations (simplified for frontend use)
    friends: {
        id: string;
        name: string;
        username?: string;
        image?: string;
        lastLat?: number;
        lastLng?: number;
        lastSeen?: Date;
    }[];
    friendRequests: {
        incoming: { id: string; name: string; username?: string; image?: string }[];
        outgoing: { id: string; name: string; username?: string; image?: string }[];
    };
}

// Define a type that includes the relations we need
// We use a broader type here to accommodate potential nulls from Prisma
type UserWithRelations = Prisma.UserGetPayload<{
    include: {
        friendsRequested: { include: { receiver: true } };
        friendsReceived: { include: { requester: true } };
    }
}> & { bio?: string | null };

export function mapPrismaUserToFrontendUser(prismaUser: UserWithRelations): User {
    // Combine friends from both directions
    const friends = [
        ...prismaUser.friendsRequested
            .filter(f => f.status === 'accepted')
            .map(f => ({
                id: f.receiver.id,
                name: f.receiver.fullName || f.receiver.name || "Unknown",
                username: f.receiver.username || undefined,
                image: f.receiver.image || undefined,
                lastLat: f.receiver.hideLocationFromFriends ? undefined : (f.receiver.lastLat || undefined),
                lastLng: f.receiver.hideLocationFromFriends ? undefined : (f.receiver.lastLng || undefined),
                lastSeen: f.receiver.hideLocationFromFriends ? undefined : (f.receiver.lastSeen || undefined)
            })),
        ...prismaUser.friendsReceived
            .filter(f => f.status === 'accepted')
            .map(f => ({
                id: f.requester.id,
                name: f.requester.fullName || f.requester.name || "Unknown",
                username: f.requester.username || undefined,
                image: f.requester.image || undefined,
                lastLat: f.requester.hideLocationFromFriends ? undefined : (f.requester.lastLat || undefined),
                lastLng: f.requester.hideLocationFromFriends ? undefined : (f.requester.lastLng || undefined),
                lastSeen: f.requester.hideLocationFromFriends ? undefined : (f.requester.lastSeen || undefined)
            }))
    ];

    const incoming = prismaUser.friendsReceived
        .filter(f => f.status === 'pending')
        .map(f => ({
            id: f.requester.id,
            name: f.requester.fullName || f.requester.name || "Unknown",
            username: f.requester.username || undefined,
            image: f.requester.image || undefined
        }));

    const outgoing = prismaUser.friendsRequested
        .filter(f => f.status === 'pending')
        .map(f => ({
            id: f.receiver.id,
            name: f.receiver.fullName || f.receiver.name || "Unknown",
            username: f.receiver.username || undefined,
            image: f.receiver.image || undefined
        }));

    return {
        id: prismaUser.id,
        name: prismaUser.name || "Unknown",
        image: prismaUser.image || undefined,
        username: prismaUser.username || undefined,
        fullName: prismaUser.fullName || undefined,
        bio: prismaUser.bio || undefined,
        isOnboarded: prismaUser.isOnboarded,
        isAnonymous: prismaUser.isAnonymous,
        hideLocationFromFriends: prismaUser.hideLocationFromFriends,
        level: prismaUser.level ?? 1,
        xp: prismaUser.xp ?? 0,
        isPremium: prismaUser.isPremium ?? false,
        lastLat: prismaUser.lastLat || undefined,
        lastLng: prismaUser.lastLng || undefined,
        lastSeen: prismaUser.lastSeen || undefined,
        friends,
        friendRequests: {
            incoming,
            outgoing
        }
    };
}

// Deprecated in-memory functions (kept as placeholders if needed during refactor, but should be removed)
export const users: any[] = [];
export const getUser = (id: string) => undefined;
export const getUserByUsername = (username: string) => undefined;
export const createUser = (id: string, name: string) => undefined;
export const updateUser = (id: string, data: any) => undefined;
