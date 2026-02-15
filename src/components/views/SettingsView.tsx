"use client";

import { useState } from "react";

import { useUser } from "@/hooks/useUser";
import { User, Shield, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import AuthPrompt from "@/components/AuthPrompt";
import { supabase } from "@/lib/supabase";

export default function SettingsView() {
    const { user, toggleAnonymity, toggleLocationPrivacy, isLoading } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", bio: "", image: "" });
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const startEditing = () => {
        if (!user) return;
        setEditForm({
            name: user.fullName || user.name || "",
            bio: user.bio || "",
            image: user.image || ""
        });
        setIsEditing(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // Create a unique file name
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id || 'unknown'}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setEditForm(prev => ({ ...prev, image: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/users/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            if (res.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    };

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
        <div className="w-full h-full flex flex-col p-4 pt-20 pb-24 pointer-events-auto bg-[#120024]/80 backdrop-blur-2xl overflow-y-auto">
            <div className="max-w-md mx-auto w-full space-y-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 drop-shadow-sm mb-6 pl-1">
                    Settings
                </h1>

                {/* Profile Card & Settings */}
                <div className="relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    {!isEditing && (
                        <button
                            onClick={startEditing}
                            className="absolute top-4 right-4 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all border border-white/10 hover:border-white/20 shadow-lg hover:shadow-purple-500/10 active:scale-95 z-10"
                        >
                            Edit Profile
                        </button>
                    )}

                    {isEditing ? (
                        <div className="space-y-5 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-center mb-2">
                                <div className="relative w-28 h-28 group cursor-pointer transition-transform hover:scale-105">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                                    <img
                                        src={editForm.image || user.image || "https://via.placeholder.com/150"}
                                        alt="Preview"
                                        className="relative w-full h-full rounded-full object-cover opacity-60 border-2 border-white/20 z-10"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        {isUploading ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        ) : (
                                            <div className="flex flex-col items-center drop-shadow-md">
                                                <User className="text-white mb-1" size={24} />
                                                <span className="text-[10px] text-white font-bold text-center leading-tight uppercase tracking-wide">Upload<br />Photo</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-30"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        placeholder="Your Name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 ml-1">Bio</label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner min-h-[100px] resize-none"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || isUploading}
                                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-purple-900/40 disabled:opacity-50 hover:shadow-purple-500/25"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="relative w-20 h-20 shrink-0">
                                <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-full blur opacity-75"></div>
                                <div className="relative w-full h-full rounded-full bg-black p-[2px] overflow-hidden">
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold text-2xl">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-2xl font-bold text-white mb-0.5 truncate leading-tight">{user.fullName || user.name}</h2>
                                <p className="text-purple-300/80 text-sm font-medium truncate mb-2">@{user.username || user.name.replace(/\s+/g, '').toLowerCase()}</p>
                                {user.bio && (
                                    <p className="text-white/60 text-xs line-clamp-2 leading-relaxed font-light">
                                        {user.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <Shield size={14} />
                        Privacy & Visibility
                    </h3>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.07] transition-colors group">
                        <div className="pr-4">
                            <div className="text-white font-semibold mb-1 group-hover:text-purple-200 transition-colors">Hide Profile</div>
                            <div className="text-white/40 text-xs leading-relaxed">
                                Post anonymously on the map. Your name and photo will be hidden from others.
                            </div>
                        </div>
                        <button
                            onClick={() => toggleAnonymity(!user.isAnonymous)}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none ${user.isAnonymous
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                : 'bg-white/10'}`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${user.isAnonymous ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.07] transition-colors group">
                        <div className="pr-4">
                            <div className="text-white font-semibold mb-1 group-hover:text-purple-200 transition-colors">Ghost Mode</div>
                            <div className="text-white/40 text-xs leading-relaxed">
                                Hide your precise location from friends on the map. You will appear offline.
                            </div>
                        </div>
                        <button
                            onClick={() => toggleLocationPrivacy(!user.hideLocationFromFriends)}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none ${user.hideLocationFromFriends
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                : 'bg-white/10'}`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${user.hideLocationFromFriends ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 pb-8">
                    <button
                        onClick={() => signOut()}
                        className="w-full bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-2xl py-4 px-6 flex items-center justify-center gap-2 font-semibold transition-all duration-300"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
