"use client";

import { signIn } from "next-auth/react";
import { LucideIcon } from "lucide-react";
import { useUI } from "@/context/UIContext";

interface AuthPromptProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export default function AuthPrompt({ icon: Icon, title, description }: AuthPromptProps) {
    const { setLoginModalOpen } = useUI();
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-2 animate-pulse">
                <Icon size={40} className="text-purple-400" />
            </div>

            <div className="space-y-2 max-w-xs">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                    {description}
                </p>
            </div>

            <button
                onClick={() => setLoginModalOpen(true)}
                className="group relative px-8 py-3 bg-white text-black font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
                <span className="relative z-10 flex items-center gap-2">
                    Sign In
                    <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </span>
            </button>
        </div>
    );
}
