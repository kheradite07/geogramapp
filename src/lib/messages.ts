/**
 * Shared utility to unify message mapping across all API routes and the frontend.
 * This ensures that 'lat', 'lng', 'text', and 'userName' are consistent,
 * preventing flickering and identity mismatches during optimistic updates.
 */
export function mapMessage(msg: any) {
    // Identity logic: Priority is Database Chosen Name > Full Name > Auth Name
    // Respects both global and per-message anonymity
    const showIdentity = !msg.user?.isAnonymous && !msg.isAnonymous;

    return {
        id: msg.id,
        text: msg.content,
        lat: msg.latitude,
        lng: msg.longitude,
        timestamp: msg.createdAt instanceof Date ? msg.createdAt.getTime() : new Date(msg.createdAt).getTime(),
        userId: msg.userId,
        userName: showIdentity ? (msg.user?.fullName || msg.user?.name || msg.authorName || "Unknown") : "Anonymous",
        userImage: showIdentity ? (msg.user?.image || msg.authorImage || undefined) : undefined,
        likes: msg.likes || 0,
        dislikes: msg.dislikes || 0,
        likedBy: typeof msg.likedBy === 'string' ? JSON.parse(msg.likedBy || '[]') : (msg.likedBy || []),
        dislikedBy: typeof msg.dislikedBy === 'string' ? JSON.parse(msg.dislikedBy || '[]') : (msg.dislikedBy || []),
        isAnonymous: !showIdentity,
        visibility: msg.visibility,
        userIsPremium: msg.user?.isPremium || false,
        activeBadgeId: msg.user?.activeBadgeId || undefined
    };
}
