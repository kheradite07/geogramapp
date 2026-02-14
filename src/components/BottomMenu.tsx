"use client";

import { Map, Users, Settings } from "lucide-react";

type Tab = "map" | "friends" | "settings";

interface BottomMenuProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    notificationCount?: number;
}

export default function BottomMenu({ activeTab, onTabChange, notificationCount }: BottomMenuProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-50 pointer-events-none flex justify-center">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-2 flex items-center gap-2 shadow-2xl pointer-events-auto">
                <button
                    onClick={() => onTabChange("friends")}
                    className={`relative p-3 rounded-full transition-all duration-300 ${activeTab === "friends"
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                >
                    <Users size={22} />
                    {notificationCount ? (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-black">
                            {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                    ) : null}
                </button>

                {/* Map Button - Larger and Centered */}
                <button
                    onClick={() => onTabChange("map")}
                    className={`relative p-4 rounded-full transition-all duration-300 scale-110 ${activeTab === "map"
                        ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-xl shadow-purple-600/40"
                        : "bg-purple-600/20 text-white hover:bg-purple-600/30 shadow-lg"
                        }`}
                >
                    <Map size={28} strokeWidth={2.5} />
                </button>

                <button
                    onClick={() => onTabChange("settings")}
                    className={`p-3 rounded-full transition-all duration-300 ${activeTab === "settings"
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                >
                    <Settings size={22} />
                </button>
            </div>
        </div>
    );
}
