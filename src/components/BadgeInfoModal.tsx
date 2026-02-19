"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Check, Crown } from "lucide-react";
import { useTranslation } from "@/context/LocalizationContext";
import { BADGE_CONFIGS } from "@/lib/badgeConfig";

interface BadgeInfoModalProps {
    badgeId: string | null;
    isEarned: boolean;
    isActive: boolean;
    onClose: () => void;
    onActivate: (id: string) => void;
}

export default function BadgeInfoModal({
    badgeId,
    isEarned,
    isActive,
    onClose,
    onActivate
}: BadgeInfoModalProps) {
    const { t } = useTranslation();
    const config = badgeId ? BADGE_CONFIGS[badgeId] : null;

    if (!config) return null;

    return (
        <AnimatePresence>
            {badgeId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm bg-[#120024] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Header Image/Gradient Area */}
                        <div className={`h-40 w-full bg-gradient-to-br ${config.style} flex items-center justify-center relative overflow-visible`}>
                            {/* Decorative bubbles */}
                            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-black/20 rounded-full translate-x-1/4 translate-y-1/4 blur-3xl" />

                            <motion.span
                                initial={{ rotate: -20, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1.2 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="text-8xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] z-10"
                            >
                                {config.icon}
                            </motion.span>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 transition-colors z-20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Text Content */}
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="relative mb-12 group scale-[1.3] flex justify-center pointer-events-none">
                                {/* Arched Ribbon Wings (Back) */}
                                <div
                                    className={`absolute -left-8 top-8 w-16 h-10 -z-20 brightness-[0.2] bg-gradient-to-br ${config.style} [clip-path:polygon(100%_0,0_50%,100%_100%)] transition-all duration-300 group-hover:-left-10 shadow-2xl`}
                                />
                                <div
                                    className={`absolute -right-8 top-8 w-16 h-10 -z-20 brightness-[0.2] bg-gradient-to-br ${config.style} [clip-path:polygon(0_0,100%_50%,0_100%)] transition-all duration-300 group-hover:-right-10 shadow-2xl`}
                                />

                                {/* Fold Shadows */}
                                <div className="absolute -left-8 top-3 w-6 h-12 -z-10 bg-black/70 skew-y-[35deg]" />
                                <div className="absolute -right-8 top-3 w-6 h-12 -z-10 bg-black/70 -skew-y-[35deg]" />

                                {/* Arched Ribbon Body (Front) */}
                                <div className={`relative px-10 py-4 bg-gradient-to-br ${config.style} shadow-[0_15px_40px_rgba(0,0,0,0.8)] border-t border-white/60 flex items-center gap-5 overflow-hidden
                                    [clip-path:polygon(0_15%,_50%_0%,_100%_15%,_100%_85%,_50%_100%,_0_85%)]
                                    before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:opacity-60
                                    after:absolute after:inset-0 after:bg-gradient-to-r after:from-black/40 after:via-transparent after:to-black/40`}>
                                    {!isEarned && <Lock size={28} className="relative z-10 text-white/60 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />}
                                    <h2 className="relative z-10 text-4xl font-black text-white uppercase tracking-tighter drop-shadow-[0_3px_6px_rgba(0,0,0,1)]">
                                        {t(config.nameKey)}
                                    </h2>
                                </div>
                            </div>

                            <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-[240px]">
                                {t(config.descKey)}
                            </p>

                            {/* Status and Action Section */}
                            <div className="w-full space-y-4">
                                {isEarned ? (
                                    isActive ? (
                                        <div className="flex items-center justify-center gap-2 py-3 px-6 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 font-bold text-xs uppercase tracking-widest">
                                            <Check size={16} strokeWidth={3} />
                                            {t('active_badge')}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => onActivate(badgeId)}
                                            className={`w-full py-4 rounded-2xl bg-gradient-to-r from-white/10 to-white/20 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] hover:from-white/20 hover:to-white/30 transition-all active:scale-95 shadow-lg group`}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <Crown size={14} className="text-yellow-400 group-hover:scale-125 transition-transform" />
                                                {t('activate_badge_hint')}
                                            </span>
                                        </button>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center gap-4 py-4 px-6 bg-white/5 border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-2 text-white/30 font-black text-[10px] uppercase tracking-widest">
                                            <Lock size={12} />
                                            {t('locked_badge') || 'Locked Badge'}
                                        </div>
                                        <div className="h-[2px] w-8 bg-white/10" />
                                        <p className="text-[10px] text-white/40 italic">
                                            {t('locked_badge_hint') || 'Complete the requirement to unlock this badge!'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
