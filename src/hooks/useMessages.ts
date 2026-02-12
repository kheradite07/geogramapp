import useSWR from "swr";
import { Message } from "@/lib/store";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMessages() {
    const { data, error, isLoading, mutate } = useSWR<Message[]>("/api/messages", fetcher, {
        refreshInterval: 5000, // Poll every 5s for MVP
    });

    const sendMessage = async (text: string, lat: number, lng: number) => {
        const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, lat, lng }),
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
