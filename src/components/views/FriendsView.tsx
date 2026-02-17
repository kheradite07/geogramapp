"use client";

import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import AuthPrompt from "@/components/AuthPrompt";
import { Share } from "@capacitor/share";
import { Users, Search, UserPlus, UserCheck, X, UserMinus, Loader2, Share2 } from "lucide-react";

export default function FriendsView() {
    const { user, searchUsers, handleFriendRequest, isLoading } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleRemoveFriend = async (friendId: string) => {
        setLoadingAction(`remove-${friendId}`);
        await handleFriendRequest(friendId, 'remove');
        setConfirmRemove(null);
        setLoadingAction(null);
    };

    const handleFriendAction = async (userId: string, action: 'send' | 'accept' | 'reject' | 'cancel') => {
        setLoadingAction(`${action}-${userId}`);
        await handleFriendRequest(userId, action);
        setLoadingAction(null);
    };

    const handleInvite = async () => {
        const lang = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
        let text = "Let's use Geogram app together geogramapp.vercel.app";
        let title = "Join me on Geogram";

        if (lang.startsWith('tr')) {
            text = "Geogram uygulamasını seninle beraber kullanalım geogramapp.vercel.app";
            title = "Geogram'a Katıl";
        } else if (lang.startsWith('zh')) {
            text = "让我们一起使用 Geogram 应用程序 geogramapp.vercel.app";
            title = "加入 Geogram";
        }

        if (typeof navigator !== 'undefined' && navigator.share) {
            // Try Web Share API first (works on mobile web)
            try {
                await navigator.share({
                    title: title,
                    text: text,
                });
                return;
            } catch (error) {
                console.log('Web Share Error:', error);
            }
        }

        // Try Capacitor Share (Native)
        try {
            await Share.share({
                title: title,
                text: text,
                dialogTitle: title,
            });
        } catch (error) {
            console.log('Capacitor Share Error:', error);
            // Fallback for desktop or unsupported browsers
            try {
                await navigator.clipboard.writeText(text);
                alert(lang.startsWith('tr') ? "Bağlantı kopyalandı!" : "Link copied to clipboard!");
            } catch (err) {
                console.error("Clipboard failed", err);
            }
        }
    };

    // Helper to check if user has outgoing request to this person
    const hasPendingRequest = (userId: string) => {
        return user?.friendRequests.outgoing.some((req: any) => req.id === userId);
    };

    if (isLoading) {
        return <div className="text-white text-center p-8">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="w-full h-full flex flex-col p-4 pt-20 pb-24 pointer-events-auto bg-black/80 backdrop-blur-md">
                <AuthPrompt
                    icon={Users}
                    title="Connect with Friends"
                    description="Sign in to find friends, send requests, and see what they're up to on the map."
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-4 pt-20 pb-24 overflow-y-auto pointer-events-auto bg-[#120024]/80 backdrop-blur-2xl">
            <div className="max-w-md mx-auto w-full space-y-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 drop-shadow-sm mb-6 pl-1">
                    Community
                </h1>

                {/* Invite Friend Button (Mobile optimized) */}
                <button
                    onClick={handleInvite}
                    className="w-full mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 rounded-2xl p-4 flex items-center justify-between group transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20 active:scale-98"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                            <Share2 size={20} />
                        </div>
                        <div className="text-left">
                            <div className="text-white font-semibold">Invite Friends</div>
                            <div className="text-green-200/60 text-xs">Share Geogram via WhatsApp, etc.</div>
                        </div>
                    </div>
                </button>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500 ${isSearchFocused ? 'opacity-70 blur-md' : ''}`}></div>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                            placeholder="Find friends..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-inner"
                            style={isSearchFocused ? {
                                paddingLeft: '56px',
                                color: 'white'
                            } : {
                                paddingLeft: '48px'
                            }}
                        />
                        <Search className="absolute left-4 top-4 text-white/50 group-hover:text-white/80 transition-colors" size={20} />
                        {isSearchFocused && (
                            <div
                                className="absolute left-12 text-purple-400 font-medium pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200"
                                style={{
                                    top: '15px',
                                    fontSize: '16px',
                                    textShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
                                }}
                            >
                                @
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isSearching}
                            className={`absolute right-2 top-2 h-[calc(100%-16px)] px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 shadow-lg ${isSearchFocused || searchQuery
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/25 hover:scale-105'
                                : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                        >
                            {isSearching ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                'Search'
                            )}
                        </button>
                    </div>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xs font-bold text-purple-300/80 uppercase tracking-widest pl-1">Found Users</h3>
                        {searchResults.map((result) => {
                            const isPending = hasPendingRequest(result.id);
                            const isFriend = user.friends.some((f: any) => f.id === result.id);

                            return (
                                <div key={result.id} className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-lg hover:shadow-purple-500/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-purple-500/50 to-indigo-500/50">
                                            <div className="w-full h-full rounded-full bg-black/50 overflow-hidden flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                                                {result.image ? (
                                                    <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    result.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-white font-semibold text-lg leading-tight group-hover:text-purple-200 transition-colors">{result.name}</div>
                                            {result.username && (
                                                <div className="text-white/40 text-sm">@{result.username}</div>
                                            )}
                                        </div>
                                    </div>
                                    {isFriend ? (
                                        <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                                            Following
                                        </div>
                                    ) : isPending ? (
                                        <button
                                            onClick={() => handleFriendAction(result.id, 'cancel')}
                                            disabled={loadingAction === `cancel-${result.id}`}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-xs font-medium transition-all border border-white/5 hover:border-white/20"
                                        >
                                            {loadingAction === `cancel-${result.id}` ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                'Pending'
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleFriendAction(result.id, 'send')}
                                            disabled={loadingAction === `send-${result.id}`}
                                            className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all"
                                        >
                                            {loadingAction === `send-${result.id}` ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                <UserPlus size={20} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Friend Requests */}
                {user.friendRequests.incoming.length > 0 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <div className="flex items-center gap-2 pl-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                            <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest">Requests</h3>
                        </div>

                        {user.friendRequests.incoming.map((req) => (
                            <div key={req.id} className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 to-black/40 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-purple-900/20">
                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
                                        {req.image ? (
                                            <img src={req.image} alt={req.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            req.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-white font-semibold truncate">{req.name}</div>
                                        <div className="text-purple-300 text-xs truncate">Wants to connect</div>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0 ml-2">
                                    <button
                                        onClick={() => handleFriendAction(req.id, 'accept')}
                                        disabled={loadingAction === `accept-${req.id}`}
                                        className="p-2.5 bg-green-500/80 hover:bg-green-500 text-white rounded-xl shadow-lg hover:scale-105 transition-all"
                                    >
                                        {loadingAction === `accept-${req.id}` ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <UserCheck size={18} strokeWidth={2.5} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleFriendAction(req.id, 'reject')}
                                        disabled={loadingAction === `reject-${req.id}`}
                                        className="p-2.5 bg-white/10 hover:bg-white/20 text-white/60 hover:text-red-400 rounded-xl transition-all"
                                    >
                                        {loadingAction === `reject-${req.id}` ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <X size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Friends List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1 mt-6">My Circle ({user.friends.length})</h3>
                    {user.friends.length === 0 ? (
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center backdrop-blur-sm">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="text-white/20" size={32} />
                            </div>
                            <p className="text-white/40 font-medium">No friends yet</p>
                            <p className="text-white/20 text-sm mt-1">Search for people to build your circle.</p>
                        </div>
                    ) : (
                        user.friends.map((friend) => (
                            <div key={friend.id} className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl p-3 flex items-center justify-between transition-all duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-transparent group-hover:ring-purple-500/30 transition-all">
                                            {friend.image ? (
                                                <img src={friend.image} alt={friend.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                friend.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#120024] rounded-full"></div>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-white font-medium truncate group-hover:text-purple-200 transition-colors">{friend.name}</div>
                                        {friend.username && <div className="text-white/30 text-xs truncate">@{friend.username}</div>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setConfirmRemove({ id: friend.id, name: friend.name })}
                                    className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <UserMinus size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmRemove && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#1a0033] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                            <UserMinus className="text-red-500" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Unfriend {confirmRemove.name}?</h3>
                        <p className="text-white/60 mb-8 text-sm leading-relaxed">
                            They will be removed from your friends list and won't be able to see your private posts.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmRemove(null)}
                                disabled={loadingAction === `remove-${confirmRemove.id}`}
                                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRemoveFriend(confirmRemove.id)}
                                disabled={loadingAction === `remove-${confirmRemove.id}`}
                                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                            >
                                {loadingAction === `remove-${confirmRemove.id}` ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Removing
                                    </>
                                ) : (
                                    'Remove Friend'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
