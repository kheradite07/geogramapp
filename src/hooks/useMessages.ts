import useSWR from "swr";
import { Message } from "@/app/api/messages/route"; // basic type sharing

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

    return {
        messages: data || [],
        isLoading,
        isError: error,
        sendMessage,
    };
}
