// This file is now just for type definitions as we moved to Prisma
// The actual data access logic is in the API routes using prisma client

export type Message = {
    id: string;
    text: string;
    lat: number;
    lng: number;
    timestamp: number; // Unix timestamp
    userId: string;
    userName: string;
    userImage?: string;
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
    isAnonymous?: boolean;
    visibility: 'public' | 'friends';
};

// Deprecated in-memory store
// Kept to avoid breaking imports in files that haven't been fully refactored yet
// but it will be empty and unused by the core logic
export const messages: Message[] = [];

export function clearAllMessages(): void {
    messages.length = 0;
}
