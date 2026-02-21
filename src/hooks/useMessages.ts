import useSWR from "swr";
import { Message } from "@/lib/store";

import { getApiUrl } from "@/lib/api";

const fetcher = (url: string) => fetch(getApiUrl(url), { credentials: 'include' }).then((res) => res.json());

export function useMessages() {
    const { data, error, isLoading, mutate } = useSWR<Message[]>("/api/messages", fetcher, {
        refreshInterval: 10000, // Poll every 10s (reduced from 5s)
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshWhenHidden: false,
        refreshWhenOffline: false
    });

    const sendMessage = async (text: string, lat: number, lng: number, visibility: 'public' | 'friends' = 'public', userContext?: any) => {
        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            text,
            lat,
            lng,
            timestamp: Date.now(),
            userId: userContext?.id || 'me',
            userName: userContext?.name || userContext?.userName || 'You',
            userImage: userContext?.image || userContext?.userImage,
            likes: 0,
            dislikes: 0,
            likedBy: [],
            dislikedBy: [],
            visibility,
            activeBadgeId: userContext?.activeBadgeId
        };

        const options = {
            optimisticData: [...(data || []), optimisticMessage],
            rollbackOnError: true,
            populateCache: (serverRes: any) => {
                // If the server returns a successful post result
                if (serverRes && serverRes.success && serverRes.message) {
                    const realMessage = serverRes.message;
                    // Replace the temporary message with the real one to maintain list integrity
                    // Also filter out any possible duplicates if the real message was already added by a background refresh
                    const updatedData = (data || [])
                        .map(m => m.id === optimisticMessage.id ? realMessage : m)
                        .filter(m => m.id !== optimisticMessage.id || m.id === realMessage.id);

                    if (!updatedData.find(m => m.id === realMessage.id)) {
                        updatedData.push(realMessage);
                    }
                    return updatedData;
                }
                return data || [];
            },
            revalidate: true,
        };

        try {
            const result = await mutate(
                (async () => {
                    const res = await fetch(getApiUrl("/api/messages"), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: 'include',
                        body: JSON.stringify({ text, lat, lng, visibility }),
                    });

                    const resData = await res.json();

                    if (!res.ok) {
                        const error: any = new Error(resData.error || "Failed to post message");
                        error.status = res.status;
                        error.isPremiumCallback = resData.isPremiumCallback;
                        error.resetTime = resData.resetTime;
                        throw error;
                    }

                    return resData; // Return data for mutate to handle if needed
                })(),
                options
            );

            // Mutate returns the resolved data from the promise above (resData)
            const resData = result as any;
            return {
                success: true,
                data: resData,
                levelUp: resData?.levelUp,
                userUpdates: resData?.userUpdates
            };
        } catch (err: any) {
            // Only log as error if it's not a business rule (like 403 limit)
            if (err.status === 403) {
                console.warn("🚫 Message post blocked by business rule:", err.message);
            } else {
                console.error("❌ Optimistic Send failed:", err);
            }

            return {
                success: false,
                error: err.message || "Failed to post message",
                isPremiumCallback: err.isPremiumCallback,
                resetTime: err.resetTime,
                status: err.status
            };
        }
    };

    const voteMessage = async (id: string, action: 'like' | 'dislike', userId?: string, unlimited: boolean = false) => {
        if (!data) return;

        // Calculate the optimistic state
        const updatedMessages = data.map(msg => {
            if (msg.id !== id) return msg;

            let newLikedBy = [...(msg.likedBy || [])];
            let newLikes = msg.likes || 0;

            if (action === 'like' && userId) {
                const isLiked = newLikedBy.includes(userId);
                if (isLiked) {
                    newLikedBy = newLikedBy.filter(uid => uid !== userId);
                    newLikes = Math.max(0, newLikes - 1);
                } else {
                    newLikedBy.push(userId);
                    newLikes++;
                }
            }

            return { ...msg, likedBy: newLikedBy, likes: newLikes };
        });

        // Trigger optimistic update
        const options = {
            optimisticData: updatedMessages,
            rollbackOnError: true,
            populateCache: true,
            revalidate: true
        };

        try {
            await mutate(
                (async () => {
                    const res = await fetch(getApiUrl(`/api/messages/${id}/vote`), {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: 'include',
                        body: JSON.stringify({ action, unlimited }),
                    });

                    if (!res.ok) {
                        if (res.status === 404) return data.filter(m => m.id !== id);
                        const error: any = new Error("Failed to vote");
                        error.status = res.status;
                        throw error;
                    }

                    // Return the optimistic data as the "final" state to prevent flicker
                    // SWR will revalidate anyway due to revalidate: true
                    return updatedMessages;
                })(),
                options
            );
        } catch (err: any) {
            if (err.status !== 404) {
                console.error("❌ Voting failed:", err);
            }
        }
    };

    const deleteMessage = async (id: string) => {
        if (!data) return { success: false };

        // Optimistic: remove from list immediately
        const updatedMessages = data.filter(msg => msg.id !== id);
        const options = {
            optimisticData: updatedMessages,
            rollbackOnError: true,
            populateCache: true,
            revalidate: true
        };

        try {
            await mutate(
                (async () => {
                    const res = await fetch(getApiUrl(`/api/messages/${id}`), {
                        method: "DELETE",
                        credentials: 'include',
                    });

                    if (!res.ok) {
                        const error: any = new Error("Failed to delete message");
                        error.status = res.status;
                        throw error;
                    }

                    return updatedMessages;
                })(),
                options
            );
            return { success: true };
        } catch (err: any) {
            console.error("❌ Delete failed:", err);
            return { success: false };
        }
    };

    return {
        messages: Array.isArray(data) ? data : [],
        isLoading,
        isError: error,
        sendMessage,
        voteMessage,
        deleteMessage,
    };
}
