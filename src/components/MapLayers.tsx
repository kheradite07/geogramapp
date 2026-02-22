"use client";

import { useState } from "react";
import { Layers, Users, MapPin, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type FilterMode = 'all' | 'friends-posts' | 'friends-locations';

interface MapLayersProps {
    currentFilter: FilterMode;
    onFilterChange: (filter: FilterMode) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export default function MapLayers({ currentFilter, onFilterChange, isOpen, onToggle }: MapLayersProps) {
    const filters = [
        { id: 'all', icon: Globe },
        { id: 'friends-posts', icon: Users },
        { id: 'friends-locations', icon: MapPin },
    ];


    return (
        <motion.div
            className="absolute top-[calc(6rem+env(safe-area-inset-top))] left-4 z-[100] flex flex-col items-center bg-[#1a0033]/90 backdrop-blur-xl border border-white/20 shadow-xl overflow-hidden pointer-events-auto"
            initial={false}
            animate={{
                width: 44, // Fixed width
                height: isOpen ? "auto" : 44, // Expand height
                borderRadius: 22 // Pill shape
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ minHeight: 44 }}
        >
            {/* Main Toggle Button */}
            <button
                onClick={onToggle}
                className={`w-11 h-11 flex items-center justify-center shrink-0 transition-colors hover:text-purple-300 ${isOpen ? 'text-purple-400' : 'text-white'
                    }`}
                title="Map Filters"
            >
                <Layers size={22} className={isOpen ? "rotate-90 transition-transform duration-300" : "transition-transform duration-300"} />
            </button>

            {/* Options List */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center gap-1.5 pb-2 w-full"
                    >
                        <div className="w-6 h-[1px] bg-white/10 my-0.5 rounded-full" />

                        {filters.map((filter) => {
                            const Icon = filter.icon;
                            const isActive = currentFilter === filter.id;

                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => {
                                        onFilterChange(filter.id as FilterMode);
                                        onToggle(); // Close on selection
                                    }}
                                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 group ${isActive
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40 scale-110'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Icon size={18} />

                                    {/* Active Indicator Dot */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-dot"
                                            className="absolute -right-1 w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_4px_#4ade80]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
