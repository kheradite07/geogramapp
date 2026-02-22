"use client";

import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, LogOut, User as UserIcon, MapPin, Crown, Check, Lock } from "lucide-react";
import useSWR from "swr";
import { useUser } from "@/hooks/useUser";
import { Suspense, useState, useEffect } from "react";
import { getApiUrl } from "@/lib/api";
import { BADGE_CONFIGS } from "@/lib/badgeConfig";
import { useTranslation } from "@/context/LocalizationContext";
import BadgeInfoModal from "@/components/BadgeInfoModal";

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
    const { t } = useTranslation();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
    // Get ID from query param (?id=...)
    const userId = searchParams.get('id');

    // Currently logged-in user details
    const { user: currentUser } = useUser();

    // Determine if viewing own profile
    const isOwnProfile = !userId || currentUser?.id === userId || session?.user?.email === userId;

    // If no userId and dealing with own profile, use current user ID if available
    const effectiveUserId = userId || currentUser?.id;
    const isFriendUser = !isOwnProfile && currentUser?.friends?.some((f: any) => f.id === effectiveUserId);

    const { data: publicProfile, error, isLoading } = useSWR(
        isOwnProfile || !effectiveUserId ? null : `/api/users/${effectiveUserId}`,
        fetcher
    );

    // Fetch user's messages
    const { data: userMessages, isLoading: messagesLoading } = useSWR(
        effectiveUserId ? `/api/users/${effectiveUserId}/messages` : null,
        fetcher
    );

    // Re-fetch profile data to ensure freshness, especially if coming from a mutation
    const { mutate } = useSWR(
        isOwnProfile || !effectiveUserId ? null : `/api/users/${effectiveUserId}`,
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
        <div className="min-h-screen p-4 flex flex-col pointer-events-none pb-24">
            <div className="w-full max-w-lg mx-auto mt-10 pointer-events-auto">
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center px-4 py-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all backdrop-blur-md border border-white/10"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    {t('back_to_map') || 'Back to Map'}
                </button>

                <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative">
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className={`absolute inset-0 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 ${isFriendUser ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-purple-600 to-blue-600'}`}></div>
                            <div className={`relative w-32 h-32 rounded-full p-1 ${isFriendUser ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-black'}`}>
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
                            {displayUser.activeBadgeId && BADGE_CONFIGS[displayUser.activeBadgeId] && (
                                <div
                                    title={t(BADGE_CONFIGS[displayUser.activeBadgeId].nameKey)}
                                    className={`absolute top-0 right-0 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${BADGE_CONFIGS[displayUser.activeBadgeId].style} text-3xl shadow-lg transform rotate-12 ring-2 ring-black`}
                                >
                                    {BADGE_CONFIGS[displayUser.activeBadgeId].icon}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-2 mt-6">
                            <h1 className="text-3xl font-bold text-white drop-shadow-md text-center">
                                {displayUser.fullName || displayUser.name || "Anonymous User"}
                            </h1>
                        </div>

                        <p className="text-cyan-400 text-lg font-medium mb-1">
                            @{displayUser.username || (displayUser.name ? displayUser.name.replace(/\s+/g, '').toLowerCase() : "user")}
                        </p>

                        {displayUser.bio && (
                            <p className="text-gray-300 text-center mt-4 max-w-sm italic">
                                &quot;{displayUser.bio}&quot;
                            </p>
                        )}

                        {/* Badge Collection Section */}
                        {displayUser.badges && displayUser.badges.length > 0 && (
                            <div className="w-full mt-8 bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-4 px-1">
                                    <Crown size={16} className="text-yellow-400" />
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('badges_collection') || 'Badge Collection'}</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                                    {displayUser.badges.map((b: any) => {
                                        const config = BADGE_CONFIGS[b.badgeId];
                                        if (!config) return null;
                                        // On profile page, we usually only see earned badges
                                        // But if we ever show all, we handle lock icon
                                        const isEarned = true; // In current profile logic, badges array only has earned ones

                                        return (
                                            <div key={b.id} className="flex flex-col items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedBadgeId(b.badgeId)}
                                                    className={`relative w-14 h-14 flex items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br ${config.style} shadow-[0_4px_15px_rgba(0,0,0,0.3)] transform transition-transform hover:scale-110 active:scale-95 cursor-pointer`}
                                                    title={t(config.nameKey)}
                                                >
                                                    <span className="text-5xl absolute transition-all duration-500 z-10 drop-shadow-2xl">{config.icon}</span>
                                                </button>
                                                <div className="relative mt-[-20px] group z-40 w-full flex justify-center items-center pointer-events-none">
                                                    {/* Arched Ribbon Wings (Back) */}
                                                    <div
                                                        className={`absolute left-[calc(50%-36px)] top-3 w-8 h-4 -z-20 brightness-[0.3] bg-gradient-to-br ${config.style} [clip-path:polygon(100%_0,0_50%,100%_100%)] group-hover:left-[calc(50%-42px)] transition-all duration-300 shadow-2xl`}
                                                    />
                                                    <div
                                                        className={`absolute right-[calc(50%-36px)] top-3 w-8 h-4 -z-20 brightness-[0.3] bg-gradient-to-br ${config.style} [clip-path:polygon(0_0,100%_50%,0_100%)] group-hover:right-[calc(50%-42px)] transition-all duration-300 shadow-2xl`}
                                                    />

                                                    {/* Fold Shadows */}
                                                    <div className="absolute left-[calc(50%-26px)] top-1 w-3 h-5 -z-10 bg-black/60 skew-y-[30deg]" />
                                                    <div className="absolute right-[calc(50%-26px)] top-1 w-3 h-5 -z-10 bg-black/60 -skew-y-[30deg]" />

                                                    {/* Arched Ribbon Body (Front) */}
                                                    <div className={`relative px-4 py-2 bg-gradient-to-br ${config.style} shadow-[0_8px_25px_rgba(0,0,0,0.7)] border-t border-white/50 min-w-[70px] max-w-[90px] flex items-center justify-center overflow-hidden
                                                        [clip-path:polygon(0_15%,_50%_0%,_100%_15%,_100%_85%,_50%_100%,_0_85%)]
                                                        before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/30 before:to-transparent before:opacity-50
                                                        after:absolute after:inset-0 after:bg-gradient-to-r after:from-black/30 after:via-transparent after:to-black/30`}>
                                                        <span className={`relative z-10 text-[11px] font-black uppercase tracking-tight text-center leading-none transition-all duration-500 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] whitespace-nowrap overflow-hidden text-ellipsis px-1 text-white`}>
                                                            {t(config.nameKey)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {isOwnProfile && session?.user?.email && (
                            <p className="text-gray-400 text-sm mt-2 mb-6">{session.user.email}</p>
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

            <BadgeInfoModal
                badgeId={selectedBadgeId}
                isEarned={isOwnProfile ? (!!currentUser?.badges?.find((b: any) => b.badgeId === selectedBadgeId)) : (!!displayUser.badges?.find((b: any) => b.badgeId === selectedBadgeId))}
                isActive={displayUser.activeBadgeId === selectedBadgeId}
                canActivate={isOwnProfile}
                onClose={() => setSelectedBadgeId(null)}
                onActivate={async (id) => {
                    if (!isOwnProfile) return;
                    // Handle activation logic here for own profile
                    try {
                        const res = await fetch('/api/users/update', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ activeBadgeId: id })
                        });
                        if (res.ok) {
                            if (currentUser) {
                                currentUser.activeBadgeId = id;
                            }
                            setSelectedBadgeId(null);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }}
            />
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
