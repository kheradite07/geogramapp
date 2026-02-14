import useSWR from "swr";
import { User } from "@/lib/userStore";

import { getApiUrl } from "@/lib/api";

const fetcher = async (url: string) => {
    const res = await fetch(getApiUrl(url), { credentials: 'include' });
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
        // Optimistic update
        if (user) {
            mutate({ ...user, isAnonymous }, false);
        }

        const res = await fetch(getApiUrl("/api/users/me"), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ isAnonymous }),
        });

        if (res.ok) {
            mutate();
        } else {
            // Revert on error
            mutate();
        }
    };

    const toggleLocationPrivacy = async (hideLocation: boolean) => {
        // Optimistic update
        if (user) {
            mutate({ ...user, hideLocationFromFriends: hideLocation }, false);
        }

        const res = await fetch(getApiUrl("/api/users/privacy"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ hideLocationFromFriends: hideLocation }),
        });

        if (res.ok) {
            mutate();
        } else {
            // Revert on error
            mutate();
        }
    };

    const searchUsers = async (query: string) => {
        if (!query || query.length < 2) return [];
        const res = await fetch(getApiUrl(`/api/users/search?q=${encodeURIComponent(query)}`), { credentials: 'include' });
        return res.json();
    };

    const handleFriendRequest = async (targetUserId: string, action: 'send' | 'accept' | 'reject' | 'remove' | 'cancel') => {
        // Optimistic update could be added here
        const res = await fetch(getApiUrl(`/api/users/${encodeURIComponent(targetUserId)}/friend`), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
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
