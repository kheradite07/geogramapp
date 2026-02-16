"use client";

import { Map, Users, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "map" | "friends" | "settings";

interface BottomMenuProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    notificationCount?: number;
}

import { useUI } from "@/context/UIContext";

export default function BottomMenu({ activeTab, onTabChange, notificationCount }: BottomMenuProps) {
    const { isKeyboardOpen } = useUI();
    const tabs = [
        { id: "friends", icon: Users, label: "Friends" },
        { id: "map", icon: Map, label: "Map" },
        { id: "settings", icon: Settings, label: "Settings" },
    ] as const;

    if (isKeyboardOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-3 z-60 pointer-events-none flex justify-center" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full p-1 flex items-center gap-1 shadow-2xl pointer-events-auto relative"
            >
                {/* Background Blur Layer - Updated to match rounded shape specifically */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-full overflow-hidden" />

                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    const isMap = tab.id === 'map';

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`relative flex items-center justify-center rounded-full transition-all duration-300 z-10 ${isMap
                                ? "w-14 h-14 sm:w-16 sm:h-16" // Keep map button large
                                : "w-10 h-10 sm:w-12 sm:h-12" // Shrink other buttons
                                }`}
                            style={{
                                WebkitTapHighlightColor: "transparent",
                            }}
                        >
                            {/* Unified Active Indicator for Liquid Effect */}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className={`absolute inset-0 rounded-full ${isMap
                                        ? "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-[0_0_30px_rgba(124,58,237,0.6)] border border-white/20"
                                        : "bg-white/10 border border-white/10"
                                        }`}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 25,
                                        mass: 1
                                    }}
                                />
                            )}

                            {/* Inactive Map Emphasis (Persistent Highlighting) */}
                            {!isActive && isMap && (
                                <div className="absolute inset-0 rounded-full bg-purple-500/20 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" />
                            )}

                            {/* Icon Animation */}
                            <motion.div
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    rotate: isActive && tab.id === 'settings' ? 90 : 0
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className="relative z-20"
                            >
                                <Icon
                                    size={isMap ? 28 : 20} // Smaller icons for others
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`transition-colors duration-300 ${isActive
                                        ? "text-white"
                                        : isMap
                                            ? "text-purple-200" // Map always has a tint
                                            : "text-white/40 group-hover:text-white/80"
                                        }`}
                                />

                                {/* Notification Badge */}
                                {tab.id === "friends" && notificationCount ? (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-black shadow-sm"
                                    >
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </motion.span>
                                ) : null}
                            </motion.div>
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
}
