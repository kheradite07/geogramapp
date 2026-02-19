"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useTranslation } from "@/context/LocalizationContext";
import { BADGE_CONFIGS } from "@/lib/badgeConfig";
import { motion, AnimatePresence } from "framer-motion";

interface BadgeEarnedModalProps {
    badgeId: string;
    onClose: () => void;
}

export default function BadgeEarnedModal({ badgeId, onClose }: BadgeEarnedModalProps) {
    const { t } = useTranslation();
    const [show, setShow] = useState(false);
    const config = BADGE_CONFIGS[badgeId];

    useEffect(() => {
        if (!config) {
            onClose();
            return;
        }

        // Delay showing slightly to ensure clean animation
        const timer = setTimeout(() => setShow(true), 50);

        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10002 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [badgeId]);

    const handleClose = () => {
        setShow(false);
        // Wait for exit animation
        setTimeout(onClose, 400);
    };

    if (!config) return null;

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <AnimatePresence>
                {show && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
                            onClick={handleClose}
                        />

                        <motion.div
                            key="modal"
                            initial={{ scale: 0.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.5, opacity: 0, y: 50 }}
                            transition={{ type: "spring", damping: 15, stiffness: 200 }}
                            className="relative bg-[#1a0033] border-2 border-white/10 rounded-[40px] p-8 max-w-sm w-full shadow-2xl overflow-hidden pointer-events-auto z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Background effects */}
                            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${config.style} opacity-10`} />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl opacity-50" />

                            <div className="relative flex flex-col items-center text-center">
                                <motion.div
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 12, scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${config.style} flex items-center justify-center text-5xl mb-6 shadow-2xl`}
                                >
                                    {config.icon}
                                </motion.div>

                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-white/60 text-xs font-black uppercase tracking-[0.2em] mb-2"
                                >
                                    NEW BADGE UNLOCKED
                                </motion.h3>

                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-3xl font-black text-white mb-4 leading-tight"
                                >
                                    {t(config.nameKey)}
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-white/70 text-sm leading-relaxed mb-8"
                                >
                                    {t(config.descKey)}
                                </motion.p>

                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    onClick={handleClose}
                                    className={`w-full py-4 bg-gradient-to-r ${config.style} rounded-2xl text-white font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all relative z-50 cursor-pointer`}
                                >
                                    {t('understood') || "Awesome!"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
