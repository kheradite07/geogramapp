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
    ghostExceptions: string; // JSON array of friend user IDs
    level?: number;
    xp?: number;
    isPremium?: boolean;

    // Badge System
    activeBadgeId?: string;
    badges: {
        id: string;
        badgeId: string;
        earnedAt: Date;
    }[];

    // Relations (simplified for frontend use)
    friends: {
        id: string;
        name: string;
        username?: string;
        image?: string;
        lastLat?: number;
        lastLng?: number;
        lastSeen?: Date;
        activeBadgeId?: string;
    }[];
    friendRequests: {
        incoming: { id: string; name: string; username?: string; image?: string; activeBadgeId?: string }[];
        outgoing: { id: string; name: string; username?: string; image?: string; activeBadgeId?: string }[];
    };
}

// Define a type that includes the relations we need
// We use a broader type here to accommodate potential nulls from Prisma
type UserWithRelations = Prisma.UserGetPayload<{
    include: {
        friendsRequested: { include: { receiver: true } };
        friendsReceived: { include: { requester: true } };
        badges: true;
    }
}> & { bio?: string | null };

export function mapPrismaUserToFrontendUser(prismaUser: UserWithRelations, viewingUserId?: string): User {
    const viewingId = viewingUserId || "";

    // Combine friends from both directions
    const friends = [
        ...prismaUser.friendsRequested
            .filter(f => f.status === 'accepted')
            .map(f => {
                const friend = f.receiver as any;
                const exceptions = JSON.parse(friend.ghostExceptions || "[]") as string[];
                const isException = exceptions.includes(viewingId);
                const shouldHideLocation = friend.hideLocationFromFriends && !isException;

                return {
                    id: friend.id,
                    name: friend.fullName || friend.name || "Unknown",
                    username: friend.username || undefined,
                    image: friend.image || undefined,
                    lastLat: shouldHideLocation ? undefined : (friend.lastLat || undefined),
                    lastLng: shouldHideLocation ? undefined : (friend.lastLng || undefined),
                    lastSeen: shouldHideLocation ? undefined : (friend.lastSeen || undefined),
                    activeBadgeId: friend.activeBadgeId || undefined
                };
            }),
        ...prismaUser.friendsReceived
            .filter(f => f.status === 'accepted')
            .map(f => {
                const friend = f.requester as any;
                const exceptions = JSON.parse(friend.ghostExceptions || "[]") as string[];
                const isException = exceptions.includes(viewingId);
                const shouldHideLocation = friend.hideLocationFromFriends && !isException;

                return {
                    id: friend.id,
                    name: friend.fullName || friend.name || "Unknown",
                    username: friend.username || undefined,
                    image: friend.image || undefined,
                    lastLat: shouldHideLocation ? undefined : (friend.lastLat || undefined),
                    lastLng: shouldHideLocation ? undefined : (friend.lastLng || undefined),
                    lastSeen: shouldHideLocation ? undefined : (friend.lastSeen || undefined),
                    activeBadgeId: friend.activeBadgeId || undefined
                };
            })
    ];

    const incoming = prismaUser.friendsReceived
        .filter(f => f.status === 'pending')
        .map(f => ({
            id: f.requester.id,
            name: f.requester.fullName || f.requester.name || "Unknown",
            username: f.requester.username || undefined,
            image: f.requester.image || undefined,
            activeBadgeId: (f.requester as any).activeBadgeId || undefined
        }));

    const outgoing = prismaUser.friendsRequested
        .filter(f => f.status === 'pending')
        .map(f => ({
            id: f.receiver.id,
            name: f.receiver.fullName || f.receiver.name || "Unknown",
            username: f.receiver.username || undefined,
            image: f.receiver.image || undefined,
            activeBadgeId: (f.receiver as any).activeBadgeId || undefined
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
        ghostExceptions: (prismaUser as any).ghostExceptions || "[]",
        level: prismaUser.level ?? 1,
        xp: prismaUser.xp ?? 0,
        isPremium: prismaUser.isPremium ?? false,
        lastLat: prismaUser.lastLat || undefined,
        lastLng: prismaUser.lastLng || undefined,
        lastSeen: prismaUser.lastSeen || undefined,
        activeBadgeId: (prismaUser as any).activeBadgeId || undefined,
        badges: ((prismaUser as any).badges || []).map((b: any) => ({
            id: b.id,
            badgeId: b.badgeId,
            earnedAt: b.earnedAt
        })),
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
