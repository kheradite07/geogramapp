"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useUser } from "@/hooks/useUser";
import { User, Shield, LogOut, Settings, Settings2, Globe, Check, Loader2, X, Crown, Lock } from "lucide-react";
import { signOut } from "next-auth/react";
import AuthPrompt from "@/components/AuthPrompt";
import { supabase } from "@/lib/supabase";
import { getLevelProgress, getXPForNextLevel, getLevelTitle } from "@/lib/gameLogic";
import { useTranslation } from "@/context/LocalizationContext";
import { Language } from "@/lib/translations";
import { BADGE_CONFIGS } from "@/lib/badgeConfig";
import BadgeInfoModal from "@/components/BadgeInfoModal";

const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
    { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
    { code: 'zh-Hans', name: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳' },
    { code: 'zh-Hant', name: 'Chinese (Traditional)', native: '繁體中文', flag: '🇭🇰' },
    // { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
    { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
    { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
    { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' }
];

function LanguageDropdown({ lang, setLanguage }: { lang: string, setLanguage: (l: Language) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white/5 border transition-all rounded-2xl p-4 flex items-center justify-between group shadow-lg active:scale-95 duration-200 ${isOpen ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 hover:bg-white/10'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-sm">{selectedLang.flag}</span>
                    <div className="text-left">
                        <div className="text-white font-bold">{selectedLang.native}</div>
                        <div className="text-white/40 text-[10px] uppercase tracking-widest">{selectedLang.name}</div>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <Settings2 size={18} className={`transition-colors ${isOpen ? 'text-purple-400' : 'text-white/40 group-hover:text-purple-400'}`} />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
                        className="overflow-hidden"
                    >
                        <div className="bg-[#1a0033]/40 border border-white/5 rounded-2xl p-2 mt-1 max-h-[220px] overflow-y-auto custom-scrollbar shadow-inner">
                            <style>{`
                                .custom-scrollbar::-webkit-scrollbar {
                                    width: 4px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-track {
                                    background: rgba(255, 255, 255, 0.05);
                                    border-radius: 10px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb {
                                    background: rgba(168, 85, 247, 0.4);
                                    border-radius: 10px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                    background: rgba(168, 85, 247, 0.6);
                                }
                            `}</style>
                            <div className="grid grid-cols-1 gap-1">
                                {LANGUAGES.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => {
                                            setLanguage(l.code as Language);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-center gap-4 p-2.5 rounded-xl transition-all duration-200 active:scale-98 ${lang === l.code
                                            ? 'bg-purple-600/30 border border-purple-500/40 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                                            : 'text-white/60 hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <span className="text-2xl drop-shadow-sm">{l.flag}</span>
                                        <div className="flex-1 text-left">
                                            <div className="font-bold text-sm">{l.native}</div>
                                            <div className="text-[10px] text-white/40 uppercase tracking-widest leading-none mt-1">{l.name}</div>
                                        </div>
                                        {lang === l.code && <Check size={16} className="text-purple-400 animate-in zoom-in duration-300" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function SettingsView() {
    const { user, toggleAnonymity, toggleLocationPrivacy, isLoading, mutate } = useUser();
    const { t, lang, setLanguage } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: "", username: "", bio: "", image: "" });
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 2D / 3D map toggle — persisted in localStorage, read by Map.tsx
    const [is3DMap, setIs3DMap] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_projection') !== 'mercator';
        }
        return true;
    });

    const toggle3DMap = (value: boolean) => {
        setIs3DMap(value);
        localStorage.setItem('geogram_map_projection', value ? 'globe' : 'mercator');
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'geogram_map_projection',
            newValue: value ? 'globe' : 'mercator',
        }));
    };

    // 3D Buildings toggle
    const [show3DBuildings, setShow3DBuildings] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_buildings') !== 'false';
        }
        return true;
    });

    const toggle3DBuildings = (value: boolean) => {
        setShow3DBuildings(value);
        localStorage.setItem('geogram_map_buildings', String(value));
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'geogram_map_buildings',
            newValue: String(value),
        }));
    };

    // 3D Terrain toggle
    const [show3DTerrain, setShow3DTerrain] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_terrain') === 'true';
        }
        return false;
    });

    const toggle3DTerrain = (value: boolean) => {
        setShow3DTerrain(value);
        localStorage.setItem('geogram_map_terrain', String(value));
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'geogram_map_terrain',
            newValue: String(value),
        }));
    };

    // POI / Places toggle
    const [showPOI, setShowPOI] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_poi') === 'true';
        }
        return false;
    });

    const togglePOI = (value: boolean) => {
        setShowPOI(value);
        localStorage.setItem('geogram_map_poi', String(value));
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'geogram_map_poi',
            newValue: String(value),
        }));
    };

    // Road & Transit Network toggle
    const [showTransit, setShowTransit] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_transit') === 'true';
        }
        return false;
    });

    const toggleTransit = (value: boolean) => {
        setShowTransit(value);
        localStorage.setItem('geogram_map_transit', String(value));
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'geogram_map_transit',
            newValue: String(value),
        }));
    };

    const startEditing = () => {
        if (!user) return;
        setEditData({
            name: user.fullName || user.name || "",
            username: user.username || "",
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

            setEditData(prev => ({ ...prev, image: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

    const handleSelectBadge = async (badgeId: string) => {
        try {
            const res = await fetch('/api/users/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ activeBadgeId: badgeId })
            });
            if (res.ok) {
                mutate(); // Refresh user state from SWR without page reload
            }
        } catch (error) {
            console.error("Failed to select badge:", error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/users/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });

            if (res.ok) {
                mutate(); // Revalidate user data
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
                    title={t('manage_your_experience')}
                    description={t('ghost_mode_desc')}
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col p-4 pt-20 pb-24 pointer-events-auto bg-[#120024]/80 backdrop-blur-2xl overflow-y-auto">
            <div className="max-w-md mx-auto w-full space-y-8">
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 drop-shadow-sm mb-6 pl-1">
                    {t('settings')}
                </h1>

                {/* Profile Card & Settings */}
                <div className={`relative overflow-hidden border rounded-3xl p-6 shadow-2xl backdrop-blur-md group transition-all duration-500
                    ${user.isPremium
                        ? 'bg-gradient-to-br from-yellow-900/40 via-black to-black border-yellow-500/50 shadow-yellow-500/10'
                        : 'bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10'
                    }`}
                >
                    {user.isPremium && (
                        <>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/20 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[50px] -ml-10 -mb-10 pointer-events-none"></div>
                        </>
                    )}

                    {!user.isPremium && (
                        <>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                        </>
                    )}

                    {!isEditing && (
                        <button
                            onClick={startEditing}
                            className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all border shadow-lg active:scale-95 z-40
                                ${user.isPremium
                                    ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-200 border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-yellow-500/10'
                                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-white/20 hover:shadow-purple-500/10'
                                }`}
                            title={t('edit_profile')}
                        >
                            <Settings2 size={18} />
                        </button>
                    )}

                    {isEditing ? (
                        <div className="space-y-5 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-center mb-2">
                                <div className="relative w-28 h-28 group cursor-pointer transition-transform hover:scale-105">
                                    <div className={`absolute -inset-1 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500
                                        ${user.isPremium ? 'bg-gradient-to-tr from-yellow-500 to-orange-500' : 'bg-gradient-to-tr from-purple-500 to-indigo-500'}`}
                                    ></div>
                                    <img
                                        src={editData.image || user.image || "https://via.placeholder.com/150"}
                                        alt="Preview"
                                        className="relative w-full h-full rounded-full object-cover opacity-60 border-2 border-white/20 z-10"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        {isUploading ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        ) : (
                                            <div className="flex flex-col items-center drop-shadow-md">
                                                <User className="text-white mb-1" size={24} />
                                                <span className="text-[10px] text-white font-bold text-center leading-tight uppercase tracking-wide">Photo</span>
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
                                    <label className={`block text-sm font-bold uppercase tracking-wider mb-2 ml-1 ${user.isPremium ? 'text-yellow-500' : 'text-purple-300'}`}>{t('full_name')}</label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                                        placeholder={t('full_name')}
                                        maxLength={16}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold uppercase tracking-wider mb-2 ml-1 ${user.isPremium ? 'text-yellow-500' : 'text-purple-300'}`}>{t('username')}</label>
                                    <input
                                        type="text"
                                        value={editData.username}
                                        onChange={e => setEditData({ ...editData, username: e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '') })}
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
                                        placeholder={t('username')}
                                        maxLength={16}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-bold uppercase tracking-wider mb-2 ml-1 ${user.isPremium ? 'text-yellow-500' : 'text-purple-300'}`}>{t('bio')}</label>
                                    <textarea
                                        value={editData.bio}
                                        onChange={e => setEditData({ ...editData, bio: e.target.value })}
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all shadow-inner min-h-[100px] resize-none"
                                        placeholder={t('bio')}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors border border-white/5"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || isUploading}
                                    className={`flex-1 py-3 text-white rounded-xl text-sm font-semibold transition-all shadow-lg disabled:opacity-50
                                        ${user.isPremium
                                            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-orange-900/40'
                                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/40'
                                        }`}
                                >
                                    {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : t('save')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="relative w-24 h-24 shrink-0">
                                <div className={`absolute -inset-1 rounded-full blur opacity-75
                                    ${user.isPremium ? 'bg-gradient-to-tr from-yellow-500 to-orange-500 animate-pulse' : 'bg-gradient-to-tr from-purple-500 to-cyan-500'}`}
                                ></div>
                                <div className="relative w-full h-full rounded-full bg-black p-[3px] overflow-hidden">
                                    {user.image ? (
                                        <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold text-3xl">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {user.isPremium && !user.activeBadgeId && (
                                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-black w-8 h-8 flex items-center justify-center rounded-full border-2 border-black shadow-lg z-20" title="Premium Member">
                                        👑
                                    </div>
                                )}
                                {user.activeBadgeId && BADGE_CONFIGS[user.activeBadgeId] && (
                                    <div
                                        title={t(BADGE_CONFIGS[user.activeBadgeId].nameKey)}
                                        className={`absolute top-0 right-0 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${BADGE_CONFIGS[user.activeBadgeId].style} text-2xl shadow-lg transform rotate-12 ring-2 ring-[#120024]`}
                                    >
                                        {BADGE_CONFIGS[user.activeBadgeId].icon}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-bold text-white truncate leading-tight">{user.fullName || user.name}</h2>
                                    {user.isPremium && (
                                        <span className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                            Premium
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm font-medium truncate mb-3 ${user.isPremium ? 'text-yellow-200/80' : 'text-purple-300/80'}`}>@{user.username || user.name.replace(/\s+/g, '').toLowerCase()}</p>
                                {user.bio && (
                                    <p className="text-white/60 text-xs line-clamp-2 leading-relaxed font-light">
                                        {user.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Level & XP Section */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/20 to-orange-500/0 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <div className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">{t('level')}</div>
                            <div className="flex items-baseline gap-2">
                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 flex items-center gap-2">
                                    {user.level || 1}
                                    {user.isPremium && <span className="text-2xl pt-1">👑</span>}
                                </div>
                                <div className="text-lg font-bold text-purple-300/80">
                                    {getLevelTitle(user.level || 1)}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">{t('xp_points')}</div>
                            <div className="text-xl font-bold text-white font-mono">
                                {user.xp || 0} <span className="text-white/40 text-sm">/ {getXPForNextLevel(user.level || 1)}</span>
                            </div>
                        </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="relative h-7 bg-gray-900/50 backdrop-blur-sm rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-center group">
                        {/* Progress fill */}
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-800 via-purple-600 to-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-1000 ease-out z-10"
                            style={{
                                width: `${Math.max(2, getLevelProgress(user.xp || 0).percentage)}%`
                            }}
                        >
                            {/* Glow tip */}
                            <div className="absolute top-0 right-0 h-full w-[2px] bg-white/50 blur-[2px] shadow-[0_0_10px_white]"></div>
                        </div>

                        {/* Text inside bar */}
                        <div className="relative z-20 flex items-center justify-center gap-1.5 h-full w-full text-[10px] font-bold tracking-widest uppercase text-white/90 drop-shadow-md leading-none">
                            <span className="text-purple-300">
                                {Math.ceil(getLevelProgress(user.xp || 0).total - getLevelProgress(user.xp || 0).current)} XP
                            </span>
                            <span className="opacity-80">{t('to_next_level')}</span>
                        </div>
                    </div>
                </div>

                {/* Badge Collection Section */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6 pl-1">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                                <Crown size={18} />
                            </div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-wider">{t('badges_collection')}</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                        {Object.values(BADGE_CONFIGS).map((config) => {
                            const userBadge = user.badges?.find(b => b.badgeId === config.id);
                            const isEarned = !!userBadge;
                            const isActive = user.activeBadgeId === config.id;

                            return (
                                <div key={config.id} className="flex flex-col items-center gap-2">
                                    <button
                                        onClick={() => setSelectedBadgeId(config.id)}
                                        className={`relative w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all duration-500 group shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:scale-110 active:scale-95 cursor-pointer bg-gradient-to-br ${config.style} ${isEarned
                                            ? 'border-white/20 opacity-100'
                                            : 'border-white/5 opacity-60 grayscale-[0.3]'
                                            } ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-[#120024] scale-110' : ''}`}
                                    >
                                        <span className={`text-5xl absolute transition-all duration-500 z-10 drop-shadow-2xl ${isEarned ? 'group-hover:rotate-12 group-hover:scale-125' : 'group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110'}`}>
                                            {config.icon}
                                        </span>

                                        {!isEarned && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full group-hover:bg-black/20 transition-colors z-20">
                                                <Lock size={16} className="text-white/80 drop-shadow-md" />
                                            </div>
                                        )}

                                        {isActive && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-[#120024] animate-in zoom-in-0 duration-300 z-30">
                                                <Check className="text-[#120024]" size={10} strokeWidth={4} />
                                            </div>
                                        )}
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
                                            <span className={`relative z-10 text-[11px] font-black uppercase tracking-tight text-center leading-none transition-all duration-500 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] whitespace-nowrap overflow-hidden text-ellipsis px-1 ${isEarned ? 'text-white' : 'text-white/80'}`}>
                                                {t(config.nameKey)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                            <Shield size={18} />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest">
                            {t('privacy')}
                        </h3>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.07] transition-colors group">
                        <div className="pr-4">
                            <div className="text-white font-bold mb-1 group-hover:text-purple-200 transition-colors uppercase tracking-wider text-sm">{t('hide_profile')}</div>
                            <div className="text-white/60 text-xs leading-relaxed">
                                {t('hide_profile_desc')}
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
                            <div className="text-white font-bold mb-1 group-hover:text-purple-200 transition-colors uppercase tracking-wider text-sm">{t('ghost_mode')}</div>
                            <div className="text-white/60 text-xs leading-relaxed">
                                {t('ghost_mode_desc')}
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

                {/* Map Preferences */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-1 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                            <Globe size={18} />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest">
                            {t('map')}
                        </h3>
                    </div>

                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.07] transition-colors group">
                        <div className="pr-4">
                            <div className="text-white font-bold mb-1 group-hover:text-purple-200 transition-colors uppercase tracking-wider text-sm">
                                {t('globe_3d')}
                            </div>
                            <div className="text-white/60 text-xs leading-relaxed">
                                {is3DMap ? t('globe_3d_desc_on') : t('globe_3d_desc_off')}
                            </div>
                        </div>
                        <button
                            onClick={() => toggle3DMap(!is3DMap)}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none ${is3DMap
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                : 'bg-white/10'}`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${is3DMap ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* 3D Buildings */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.07] transition-colors group">
                        <div className="pr-4">
                            <div className="text-white font-bold mb-1 group-hover:text-purple-200 transition-colors uppercase tracking-wider text-sm">
                                {t('buildings_3d')}
                            </div>
                            <div className="text-white/60 text-xs leading-relaxed">
                                {show3DBuildings ? t('buildings_3d_desc_on') : t('buildings_3d_desc_off')}
                            </div>
                        </div>
                        <button
                            onClick={() => toggle3DBuildings(!show3DBuildings)}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none ${show3DBuildings
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                : 'bg-white/10'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${show3DBuildings ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* 3D Terrain */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.07] transition-colors group">
                        <div className="pr-4">
                            <div className="text-white font-bold mb-1 group-hover:text-purple-200 transition-colors uppercase tracking-wider text-sm">
                                {t('terrain_3d')}
                            </div>
                            <div className="text-white/60 text-xs leading-relaxed">
                                {show3DTerrain ? t('terrain_3d_desc_on') : t('terrain_3d_desc_off')}
                            </div>
                        </div>
                        <button
                            onClick={() => toggle3DTerrain(!show3DTerrain)}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none ${show3DTerrain
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                : 'bg-white/10'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${show3DTerrain ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Places & Labels (POI) */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.07] transition-colors group">
                        <div className="pr-4">
                            <div className="text-white font-bold mb-1 group-hover:text-purple-200 transition-colors uppercase tracking-wider text-sm">
                                {t('places_labels')}
                            </div>
                            <div className="text-white/60 text-xs leading-relaxed">
                                {showPOI ? t('places_labels_desc_on') : t('places_labels_desc_off')}
                            </div>
                        </div>
                        <button
                            onClick={() => togglePOI(!showPOI)}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none ${showPOI
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                : 'bg-white/10'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${showPOI ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Road & Transit Network */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/[0.07] transition-colors group">
                        <div className="pr-4">
                            <div className="text-white font-bold mb-1 group-hover:text-purple-200 transition-colors uppercase tracking-wider text-sm">
                                {t('road_transit_network')}
                            </div>
                            <div className="text-white/60 text-xs leading-relaxed">
                                {showTransit ? t('road_transit_network_desc_on') : t('road_transit_network_desc_off')}
                            </div>
                        </div>
                        <button
                            onClick={() => toggleTransit(!showTransit)}
                            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none ${showTransit
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                : 'bg-white/10'}`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${showTransit ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>

                {/* Go Premium Section */}

                {!user.isPremium && (
                    <div className="relative overflow-hidden bg-gradient-to-br from-yellow-900/40 via-black to-black border-2 border-yellow-500/50 rounded-3xl p-6 shadow-2xl shadow-yellow-500/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none animate-pulse"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                                    <Crown size={22} />
                                </div>
                                <h2 className="text-xl font-black text-yellow-300 uppercase tracking-tight">{t('go_premium')}</h2>
                            </div>
                            <p className="text-yellow-100/70 text-sm mb-6 leading-relaxed">
                                {t('premium_desc')}
                            </p>
                            <button
                                onClick={() => alert(t('premium_coming_soon'))}
                                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-black rounded-2xl transition-all shadow-xl shadow-yellow-500/20 active:scale-95 uppercase tracking-wider text-sm"
                            >
                                {t('upgrade_premium')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Language Section */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6 pl-1">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                            <Globe size={18} />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest">{t('language')}</h3>
                    </div>

                    <LanguageDropdown lang={lang} setLanguage={setLanguage} />
                </div>

                {/* Account Actions */}
                <div className="pt-4 pb-8">
                    <button
                        onClick={() => signOut()}
                        className="w-full group bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-lg shadow-red-500/5 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                                <LogOut size={20} />
                            </div>
                            <span className="text-red-400 font-bold">{t('logout')}</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500/30 group-hover:text-red-500/60 transition-colors">
                            <X size={18} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Badge Info Modal */}
            <BadgeInfoModal
                badgeId={selectedBadgeId}
                isEarned={!!user.badges?.find(b => b.badgeId === selectedBadgeId)}
                isActive={user.activeBadgeId === selectedBadgeId}
                canActivate={true}
                onClose={() => setSelectedBadgeId(null)}
                onActivate={(id) => {
                    handleSelectBadge(id);
                    setSelectedBadgeId(null);
                }}
            />
        </div>
    );
}
