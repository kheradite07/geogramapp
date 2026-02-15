"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { getLevelTitle } from "@/lib/gameLogic";

interface LevelUpOverlayProps {
    level: number;
    onClose: () => void;
}

export default function LevelUpOverlay({ level, onClose }: LevelUpOverlayProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        setShow(true);

        // Fire confetti - minimal version for performance
        // From bottom-left corner, shooting diagonally up-right
        confetti({
            particleCount: 15,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 1 },
            colors: ['#FCD34D', '#F59E0B', '#818CF8', '#FFFFFF'],
            gravity: 1,
            scalar: 0.8,
            ticks: 150
        });

        // From bottom-right corner, shooting diagonally up-left
        confetti({
            particleCount: 15,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 1 },
            colors: ['#FCD34D', '#F59E0B', '#818CF8', '#FFFFFF'],
            gravity: 1,
            scalar: 0.8,
            ticks: 150
        });

        // Auto close after 3 seconds
        const timer = setTimeout(() => {
            setShow(false);
            setTimeout(onClose, 500); // Wait for fade out
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const handleClose = () => {
        setShow(false);
        setTimeout(onClose, 500);
    };

    const levelTitle = getLevelTitle(level);

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-500 pointer-events-auto ${show ? 'bg-black/80 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}
            onClick={handleClose}
        >
            <div
                className={`relative transform transition-all duration-700 pointer-events-auto ${show ? 'scale-100 translate-y-0 opacity-100' : 'scale-50 translate-y-10 opacity-0'}`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-yellow-500/30 blur-[100px] rounded-full animate-pulse pointer-events-none"></div>

                <div className="relative text-center">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all z-50 text-xl pointer-events-auto cursor-pointer"
                        aria-label="Close"
                    >
                        ×
                    </button>

                    <div className="text-8xl mb-4 animate-[bounce_1s_infinite]">
                        👑
                    </div>

                    <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.5)] animate-text">
                        LEVEL UP!
                    </h2>

                    <div className="mt-6 flex flex-col items-center gap-2">
                        <span className="text-white/60 text-lg font-bold tracking-widest uppercase">Artık bir</span>
                        <div className="px-6 py-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-2xl backdrop-blur-md">
                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300 mb-1">
                                {levelTitle}
                            </div>
                            <div className="text-sm text-white/40 font-bold">Seviye {level}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
