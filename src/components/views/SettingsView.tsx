"use client";

import { useUser } from "@/hooks/useUser";
import { User, Shield, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import AuthPrompt from "@/components/AuthPrompt";

export default function SettingsView() {
    const { user, toggleAnonymity, toggleLocationPrivacy, isLoading } = useUser();

    if (isLoading) {
        return <div className="text-white text-center p-8">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="w-full h-full flex flex-col p-4 pt-20 pointer-events-auto bg-black/80 backdrop-blur-md">
                <AuthPrompt
                    icon={Settings}
                    title="Manage Your Experience"
                    description="Sign in to customize your profile, privacy settings, and map preferences."
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-4 pt-20 pointer-events-auto bg-black/80 backdrop-blur-md">
            <div className="max-w-md mx-auto w-full space-y-6">
                <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

                {/* Profile Card */}
                <div className="bg-gradient-to-br from-purple-900/50 to-black/50 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 p-0.5">
                        {user.image ? (
                            <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover border-2 border-black" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white font-bold text-xl">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <div>
                            <h2 className="text-white font-bold text-lg">{user.fullName || user.name}</h2>
                            <p className="text-white/50 text-sm">@{user.username || user.name.replace(/\s+/g, '').toLowerCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
                        <Shield size={16} />
                        Privacy
                    </h3>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <div className="text-white font-medium">Hide Profile</div>
                            <div className="text-white/40 text-xs mt-1">
                                Post anonymously on the map. Your name and photo will be hidden.
                            </div>
                        </div>
                        <button
                            onClick={() => toggleAnonymity(!user.isAnonymous)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user.isAnonymous ? 'bg-purple-600' : 'bg-gray-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.isAnonymous ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <div className="text-white font-medium">Hide Location from Friends</div>
                            <div className="text-white/40 text-xs mt-1">
                                Your friends won't see your location on the map.
                            </div>
                        </div>
                        <button
                            onClick={() => toggleLocationPrivacy(!user.hideLocationFromFriends)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user.hideLocationFromFriends ? 'bg-purple-600' : 'bg-gray-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.hideLocationFromFriends ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-8">
                    <button
                        onClick={() => signOut()}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
