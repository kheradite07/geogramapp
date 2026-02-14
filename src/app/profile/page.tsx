"use client";

import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, LogOut, User as UserIcon, MapPin } from "lucide-react";
import useSWR from "swr";
import { useUser } from "@/hooks/useUser";
import { Suspense } from "react";
import { getApiUrl } from "@/lib/api";

const fetcher = (url: string) => fetch(getApiUrl(url), { credentials: 'include' }).then((res) => res.json());

// Helper for relative time
const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

function ProfileContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    // Get ID from query param (?id=...)
    const userId = searchParams.get('id');

    // Currently logged-in user details
    const { user: currentUser } = useUser();

    // Determine if viewing own profile
    const isOwnProfile = !userId || currentUser?.id === userId || session?.user?.email === userId;

    // If no userId and dealing with own profile, use current user ID if available
    const effectiveUserId = userId || currentUser?.id;

    const { data: publicProfile, error, isLoading } = useSWR(
        isOwnProfile || !effectiveUserId ? null : `/api/users/${effectiveUserId}`,
        fetcher
    );

    // Fetch user's messages
    const { data: userMessages, isLoading: messagesLoading } = useSWR(
        effectiveUserId ? `/api/users/${effectiveUserId}/messages` : null,
        fetcher
    );

    const displayUser = isOwnProfile ? currentUser : publicProfile;

    if (isLoading && !isOwnProfile) {
        return <div className="p-8 text-white pointer-events-auto flex justify-center mt-20">Loading profile...</div>;
    }

    if (!displayUser || (error && !isOwnProfile)) {
        if (!effectiveUserId && isLoading) return <div className="p-8 text-white pointer-events-auto flex justify-center mt-20">Loading...</div>;
        return <div className="p-8 text-white pointer-events-auto flex justify-center mt-20">User not found</div>;
    }

    return (
        <div className="min-h-screen p-4 flex flex-col pointer-events-none">
            <div className="w-full max-w-lg mx-auto mt-10 pointer-events-auto">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center px-4 py-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-md border border-white/10"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Map
                </button>

                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-32 h-32 rounded-full p-1 bg-black">
                                {displayUser.image ? (
                                    <img
                                        src={displayUser.image}
                                        alt={displayUser.name || "User"}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-[#1a1a1a] flex items-center justify-center">
                                        <UserIcon size={48} className="text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1 className="mt-6 text-3xl font-bold text-white drop-shadow-md text-center">
                            {displayUser.fullName || displayUser.name || "Anonymous User"}
                        </h1>

                        <p className="text-cyan-400 text-lg font-medium mb-1">
                            @{displayUser.username || (displayUser.name ? displayUser.name.replace(/\s+/g, '').toLowerCase() : "user")}
                        </p>

                        {isOwnProfile && session?.user?.email && (
                            <p className="text-gray-400 text-sm mb-6">{session.user.email}</p>
                        )}

                        {isOwnProfile && (
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="flex items-center space-x-2 px-6 py-2 bg-red-500/20 text-red-200 rounded-full hover:bg-red-500/30 transition-colors border border-red-500/30 backdrop-blur-sm mt-4"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-10 border-t border-white/10 pt-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 text-center">Recent Activity</h3>
                        {messagesLoading ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>Loading...</p>
                            </div>
                        ) : !userMessages || userMessages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 mx-4">
                                <p>No recent activity.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
                                {userMessages.map((message: any) => (
                                    <div
                                        key={message.id}
                                        onClick={() => {
                                            router.push(`/?lat=${message.lat}&lng=${message.lng}`);
                                        }}
                                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-medium mb-1 break-words">{message.text}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                                                    <MapPin size={12} className="flex-shrink-0" />
                                                    <span className="truncate">{message.lat.toFixed(4)}, {message.lng.toFixed(4)}</span>
                                                    <span>•</span>
                                                    <span className="whitespace-nowrap">{formatRelativeTime(message.timestamp)}</span>
                                                </div>
                                            </div>
                                            {message.visibility === 'friends' && (
                                                <div className="ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30 flex-shrink-0">
                                                    Friends
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="p-8 text-white flex justify-center mt-20">Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
