"use client";

import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import AuthPrompt from "@/components/AuthPrompt";
import { Users, Search, UserPlus, UserCheck, X, UserMinus, Loader2 } from "lucide-react";

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
        <div className="w-full h-full flex flex-col p-4 pt-20 pb-24 overflow-y-auto pointer-events-auto bg-black/80 backdrop-blur-md">
            <div className="max-w-md mx-auto w-full space-y-6">
                <h1 className="text-2xl font-bold text-white mb-4">Friends</h1>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder="Search by username..."
                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={isSearchFocused ? {
                            paddingLeft: '56px',
                            color: 'white'
                        } : {
                            paddingLeft: '42px'
                        }}
                    />
                    <Search className="absolute left-3 top-3.5 text-white/40" size={18} />
                    {isSearchFocused && (
                        <div
                            className="absolute left-10 text-purple-400 font-medium pointer-events-none"
                            style={{
                                top: '12px',
                                fontSize: '16px',
                                lineHeight: '24px',
                                textShadow: '0 0 10px rgba(192, 132, 252, 0.6), 0 0 20px rgba(192, 132, 252, 0.3)'
                            }}
                        >
                            @
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="absolute right-2 top-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {isSearching ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Searching...
                            </>
                        ) : (
                            'Search'
                        )}
                    </button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Search Results</h3>
                        {searchResults.map((result) => {
                            const isPending = hasPendingRequest(result.id);
                            const isFriend = user.friends.some((f: any) => f.id === result.id);

                            return (
                                <div key={result.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                            {result.image ? (
                                                <img src={result.image} alt={result.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                result.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{result.name}</div>
                                            {result.username && (
                                                <div className="text-purple-300 text-xs">@{result.username}</div>
                                            )}
                                        </div>
                                    </div>
                                    {isFriend ? (
                                        <span className="text-xs text-green-400 font-medium">Already Friends</span>
                                    ) : isPending ? (
                                        <button
                                            onClick={() => handleFriendAction(result.id, 'cancel')}
                                            disabled={loadingAction === `cancel-${result.id}`}
                                            className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-500/30 transition disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {loadingAction === `cancel-${result.id}` ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Canceling...
                                                </>
                                            ) : (
                                                'Cancel Request'
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleFriendAction(result.id, 'send')}
                                            disabled={loadingAction === `send-${result.id}`}
                                            className="p-2 bg-white/10 rounded-full text-white hover:bg-purple-600 transition disabled:opacity-50"
                                        >
                                            {loadingAction === `send-${result.id}` ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <UserPlus size={18} />
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
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Friend Requests</h3>
                        {user.friendRequests.incoming.map((req) => (
                            <div key={req.id} className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                                        {req.image ? (
                                            <img src={req.image} alt={req.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            req.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-white font-medium truncate">{req.name}</div>
                                        {req.username && <div className="text-purple-300 text-xs truncate">@{req.username}</div>}
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0 ml-2">
                                    <button
                                        onClick={() => handleFriendAction(req.id, 'accept')}
                                        disabled={loadingAction === `accept-${req.id}`}
                                        className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500 hover:text-white transition disabled:opacity-50"
                                    >
                                        {loadingAction === `accept-${req.id}` ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <UserCheck size={18} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleFriendAction(req.id, 'reject')}
                                        disabled={loadingAction === `reject-${req.id}`}
                                        className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition disabled:opacity-50"
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
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">My Friends ({user.friends.length})</h3>
                    {user.friends.length === 0 ? (
                        <div className="text-white/40 text-center py-8 italic">No friends yet. Search to add some!</div>
                    ) : (
                        user.friends.map((friend) => (
                            <div key={friend.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                                        {friend.image ? (
                                            <img src={friend.image} alt={friend.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            friend.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-white font-medium truncate">{friend.name}</div>
                                        {friend.username && <div className="text-purple-300 text-xs truncate">@{friend.username}</div>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setConfirmRemove({ id: friend.id, name: friend.name })}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition flex items-center gap-1"
                                >
                                    <UserMinus size={14} />
                                    Remove
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {confirmRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gradient-to-br from-purple-900/90 to-black/90 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Remove Friend?</h3>
                        <p className="text-white/70 mb-6">
                            Are you sure you want to remove <span className="text-white font-medium">{confirmRemove.name}</span> from your friends?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmRemove(null)}
                                disabled={loadingAction === `remove-${confirmRemove.id}`}
                                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRemoveFriend(confirmRemove.id)}
                                disabled={loadingAction === `remove-${confirmRemove.id}`}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loadingAction === `remove-${confirmRemove.id}` ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Removing...
                                    </>
                                ) : (
                                    'Yes, Remove'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
