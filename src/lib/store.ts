export type Message = {
    id: string;
    text: string;
    lat: number;
    lng: number;
    timestamp: number;
    userId: string;
    userName: string;
    userImage?: string;
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
};

// Singleton in-memory store
export const messages: Message[] = [];

export function clearAllMessages(): void {
    messages.length = 0;
}
