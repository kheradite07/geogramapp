"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "@/context/UIContext";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";
import MobileGoogleSignIn from "./MobileGoogleSignIn";
import { useEffect, useState } from "react";
import GeogramLogo from "./GeogramLogo";
import { useTranslation } from "@/context/LocalizationContext";

export default function LoginModal() {
    const { isLoginModalOpen, setLoginModalOpen } = useUI();
    const { t } = useTranslation();
    const { data: session } = useSession();
    const [isMobile, setIsMobile] = useState(false);

    // Auto-close when session is active
    useEffect(() => {
        if (session && isLoginModalOpen) {
            setLoginModalOpen(false);
        }
    }, [session, isLoginModalOpen, setLoginModalOpen]);

    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLoginModalOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [setLoginModalOpen]);

    if (!isLoginModalOpen) return null;

    return (
        <AnimatePresence>
            {isLoginModalOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLoginModalOpen(false)}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
                        style={{ touchAction: "none" }}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#1a0b2e]/90 border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden pointer-events-auto"
                            style={{
                                boxShadow: "0 0 50px rgba(123, 44, 191, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)"
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setLoginModalOpen(false)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                                <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
                                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-pink-600/30 rounded-full blur-3xl animate-pulse delay-1000" />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col items-center text-center space-y-6">
                                {/* App Logo */}
                                <div className="transform hover:scale-105 transition-transform duration-500">
                                    <GeogramLogo size={80} withText />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm text-white/60">
                                        {t('login_desc')}
                                    </p>
                                </div>

                                <div className="w-full space-y-3 pt-2">
                                    {/* Google Sign In - Uses Native Logic if available */}
                                    <div className="w-full relative group">
                                        <MobileGoogleSignIn />
                                    </div>

                                    {/* Mock Apple Sign In (Visual Only for now) */}
                                    <button
                                        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all bg-black rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 border border-white/10"
                                        onClick={() => alert(t('apple_coming_soon'))}
                                    >
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.127 3.675-.552 9.127 1.519 12.153 1.015 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.026-4.61 1.026zM15.521 3.3c.857-1.052 1.429-2.481 1.286-3.3-1.247.065-2.73 1.04-3.568 2.028-.756.892-1.39 2.373-1.221 3.256 1.36.143 2.662-1.026 3.503-1.984z" />
                                        </svg>
                                        {t('sign_in_with_apple')}
                                    </button>
                                </div>

                                <p className="text-xs text-white/30 pt-4 px-4 leading-relaxed">
                                    {t('terms_policy')}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
