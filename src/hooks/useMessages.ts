import useSWR from "swr";
import { Message } from "@/lib/store";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMessages() {
    const { data, error, isLoading, mutate } = useSWR<Message[]>("/api/messages", fetcher, {
        refreshInterval: 10000, // Poll every 10s (reduced from 5s)
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshWhenHidden: false,
        refreshWhenOffline: false
    });

    const sendMessage = async (text: string, lat: number, lng: number, visibility: 'public' | 'friends' = 'public') => {
        const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lat, lng, visibility }),
        });

        if (res.ok) {
            mutate(); // Refresh validation
        }
    };

    const voteMessage = async (id: string, action: 'like' | 'dislike', unlimited: boolean = false) => {
        // We trigger a local revalidation after the vote
        const res = await fetch(`/api/messages/${id}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, unlimited }),
        });

        if (res.ok) {
            mutate(); // Revalidate from server
        } else {
            // If message not found (404), it might have been deleted/expired. Revalidate to remove it from UI.
            if (res.status === 404) {
                mutate();
            }
        }
    };

    return {
        messages: data || [],
        isLoading,
        isError: error,
        sendMessage,
        voteMessage,
    };
}
