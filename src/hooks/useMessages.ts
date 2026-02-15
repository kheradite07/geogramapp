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

    const sendMessage = async (text: string, lat: number, lng: number, visibility: 'public' | 'friends' = 'public') => {
        const res = await fetch(getApiUrl("/api/messages"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ text, lat, lng, visibility }),
        });

        const data = await res.json();

        if (res.ok) {
            mutate(); // Refresh validation
            return { success: true, data };
        } else {
            return { success: false, error: data.error, isPremiumCallback: data.isPremiumCallback, status: res.status };
        }
    };

    const voteMessage = async (id: string, action: 'like' | 'dislike', unlimited: boolean = false) => {
        // We trigger a local revalidation after the vote
        const res = await fetch(getApiUrl(`/api/messages/${id}/vote`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
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
        messages: Array.isArray(data) ? data : [],
        isLoading,
        isError: error,
        sendMessage,
        voteMessage,
    };
}
