import useSWR from "swr";
import { User } from "@/lib/userStore";

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Failed to fetch user data");
    }
    return res.json();
};

export function useUser() {
    const { data: user, error, mutate } = useSWR<User>("/api/users/sync", fetcher, {
        refreshInterval: 15000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshWhenHidden: false,
        refreshWhenOffline: false
    });

    const toggleAnonymity = async (isAnonymous: boolean) => {
        const res = await fetch("/api/users/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isAnonymous }),
        });

        if (res.ok) {
            mutate();
        }
    };

    const toggleLocationPrivacy = async (hideLocation: boolean) => {
        const res = await fetch("/api/users/privacy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hideLocationFromFriends: hideLocation }),
        });

        if (res.ok) {
            mutate();
        }
    };

    const searchUsers = async (query: string) => {
        if (!query || query.length < 2) return [];
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        return res.json();
    };

    const handleFriendRequest = async (targetUserId: string, action: 'send' | 'accept' | 'reject' | 'remove') => {
        // Optimistic update could be added here
        const res = await fetch(`/api/users/${encodeURIComponent(targetUserId)}/friend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
        });

        if (res.ok) {
            mutate();
        }
        return res.ok;
    };

    return {
        user,
        isLoading: !user && !error,
        isError: error,
        toggleAnonymity,
        toggleLocationPrivacy,
        searchUsers,
        handleFriendRequest,
        mutate
    };
}
