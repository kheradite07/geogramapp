"use client";

import { Clock, Crown, X } from "lucide-react";
import { useEffect, useState } from "react";

interface DailyLimitModalProps {
    resetTime: string;
    onClose: () => void;
}

export default function DailyLimitModal({ resetTime, onClose }: DailyLimitModalProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        setShow(true);
    }, []);

    const handleClose = () => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for fade out
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 pointer-events-auto ${show ? 'bg-black/80 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0'}`}
            onClick={handleClose}
        >
            <div
                className={`relative max-w-xs w-full bg-gradient-to-br from-red-900/40 via-black to-black border-2 border-red-500/50 rounded-2xl p-5 shadow-2xl pointer-events-auto transition-all ${show ? 'opacity-100 scale-100 animate-bounce-in' : 'opacity-0 scale-50'}`}
                style={{
                    transitionDuration: '600ms',
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-2 right-2 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
                    aria-label="Kapat"
                >
                    <X size={16} />
                </button>

                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-red-500/20 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="relative text-center">
                    {/* Icon */}
                    <div className="flex justify-center mb-3">
                        <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50 animate-pulse">
                            <Clock size={28} className="text-red-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-black text-white mb-2">
                        Günlük Limit Doldu! 🛑
                    </h2>

                    {/* Description */}
                    <p className="text-white/70 text-[11px] mb-3 leading-tight">
                        Bugünlük gönderi limitinize ulaştınız.
                    </p>

                    {/* Reset time */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 mb-3">
                        <div className="text-red-300 text-[9px] font-bold uppercase tracking-wider mb-0.5">
                            Yeni Gönderi
                        </div>
                        <div className="text-white text-sm font-bold">
                            {resetTime}
                        </div>
                    </div>

                    {/* Premium CTA */}
                    <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/20 border-2 border-yellow-500/50 rounded-xl p-3 mb-3">
                        <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <Crown size={18} className="text-yellow-400" />
                            <h3 className="text-base font-bold text-yellow-300">
                                Premium'a Geç
                            </h3>
                        </div>
                        <p className="text-yellow-100/70 text-[10px] mb-2.5 leading-tight">
                            Sınırsız gönderi ve özel ayrıcalıklarla deneyimini güçlendir!
                        </p>
                        <button
                            className="w-full py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black font-bold rounded-lg transition-all shadow-lg shadow-yellow-500/25 active:scale-95 text-xs"
                            onClick={() => {
                                // TODO: Navigate to premium upgrade page
                                alert('Premium upgrade coming soon!');
                            }}
                        >
                            Premium'a Yükselt
                        </button>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                        Anladım
                    </button>
                </div>
            </div>
        </div>
    );
}
