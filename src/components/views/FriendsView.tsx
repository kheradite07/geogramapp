"use client";

import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import { Search, UserPlus, UserCheck, X } from "lucide-react";

export default function FriendsView() {
    const { user, searchUsers, handleFriendRequest, isLoading } = useUser();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    if (isLoading) {
        return <div className="text-white text-center p-8">Loading...</div>;
    }

    if (!user) {
        return <div className="text-white text-center p-8">Please sign in to manage friends.</div>;
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 pl-10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Search className="absolute left-3 top-3.5 text-white/40" size={18} />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                    >
                        Search
                    </button>
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Search Results</h3>
                        {searchResults.map((result) => (
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
                                <button
                                    onClick={() => handleFriendRequest(result.id, 'send')}
                                    className="p-2 bg-white/10 rounded-full text-white hover:bg-purple-600 transition"
                                >
                                    <UserPlus size={18} />
                                </button>
                            </div>
                        ))}
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
                                        onClick={() => handleFriendRequest(req.id, 'accept')}
                                        className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500 hover:text-white transition"
                                    >
                                        <UserCheck size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleFriendRequest(req.id, 'reject')}
                                        className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition"
                                    >
                                        <X size={18} />
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
                                    onClick={() => handleFriendRequest(friend.id, 'remove')}
                                    className="text-white/40 hover:text-red-400 transition ml-2"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
