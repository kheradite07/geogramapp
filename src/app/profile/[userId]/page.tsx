"use client";

import { useSession, signOut } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, LogOut, User } from "lucide-react";

export default function ProfilePage() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    // In a real app, we would fetch the user details by ID.
    // For this MVP with auth providers, we might only have "session" user.
    // If the profile being viewed matches the session user, show their details.
    // Otherwise, we would need a public user endpoint.
    // For now, let's assume we can view our own profile or a placeholder for others if we don't have a DB yet.

    const isOwnProfile = session?.user?.email === userId || session?.user?.name === userId || userId === "me";

    const displayUser = isOwnProfile ? session?.user : {
        name: decodeURIComponent(userId),
        image: null,
        email: null
    };

    if (!displayUser) {
        return <div className="p-8 text-white pointer-events-auto">User not found</div>;
    }

    return (
        <div className="min-h-screen p-4 flex flex-col pointer-events-none">
            <div className="w-full max-w-2xl mx-auto mt-10 pointer-events-auto">
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
                                        <User size={48} className="text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <h1 className="mt-6 text-3xl font-bold text-white drop-shadow-md">{displayUser.name || "Anonymous User"}</h1>
                        {displayUser.email && (
                            <p className="text-gray-300 text-sm mb-6">{displayUser.email}</p>
                        )}

                        {isOwnProfile && (
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="flex items-center space-x-2 px-6 py-2 bg-red-500/20 text-red-200 rounded-full hover:bg-red-500/30 transition-colors border border-red-500/30 backdrop-blur-sm"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-10 border-t border-white/10 pt-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 text-center">Activity</h3>
                        <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 mx-4">
                            <p>No recent activity deployed.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
