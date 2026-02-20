"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "@/context/UIContext";
import { X, Mail, Lock, LogIn, UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import MobileGoogleSignIn from "./MobileGoogleSignIn";
import { useEffect, useState } from "react";
import GeogramLogo from "./GeogramLogo";
import { useTranslation } from "@/context/LocalizationContext";

export default function LoginModal() {
    const { isLoginModalOpen, setLoginModalOpen } = useUI();
    const { t } = useTranslation();
    const { data: session } = useSession();
    const [view, setView] = useState<"login" | "register" | "success">("login");

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Reset state when opening
    useEffect(() => {
        if (isLoginModalOpen) {
            setView("login");
            setError("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        }
    }, [isLoginModalOpen]);

    // Auto-close when session is active
    useEffect(() => {
        if (session && isLoginModalOpen) {
            setLoginModalOpen(false);
        }
    }, [session, isLoginModalOpen, setLoginModalOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLoginModalOpen(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [setLoginModalOpen]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("supabase", {
                email,
                password,
                redirect: false,
                callbackUrl: "/",
            });

            if (result && 'error' in result && result.error) {
                setError(t('invalid_credentials') || "Invalid email or password");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError(t('passwords_not_match') || "Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError(t('password_too_short') || "Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                const translatedError = t(data.error);
                throw new Error(translatedError || data.error || "Registration failed");
            }

            setView("success");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                            className="bg-[#1a0b2e]/90 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden pointer-events-auto"
                            style={{
                                boxShadow: "0 0 50px rgba(123, 44, 191, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05)"
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setLoginModalOpen(false)}
                                className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors z-50"
                            >
                                <X size={20} />
                            </button>

                            {/* Content */}
                            <div className="flex flex-col items-center text-center space-y-4">
                                <GeogramLogo size={60} withText />

                                <AnimatePresence mode="wait">
                                    {view === "login" && (
                                        <motion.div
                                            key="login"
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: 20, opacity: 0 }}
                                            className="w-full space-y-4"
                                        >
                                            <div className="pb-2">
                                                <p className="text-xs text-white/60">{t('login_desc')}</p>
                                            </div>

                                            <form onSubmit={handleLogin} className="space-y-3">
                                                {error && <div className="text-[10px] text-red-400 bg-red-900/20 p-2 rounded-lg border border-red-500/20">{error}</div>}
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder={t('email')}
                                                        required
                                                        className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder={t('password')}
                                                        required
                                                        className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                                >
                                                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><LogIn size={18} /> {t('sign_in')}</>}
                                                </button>
                                            </form>

                                            <div className="relative py-2">
                                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                                                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#1a0b2e] px-2 text-white/40">{t('or_continue_with')}</span></div>
                                            </div>

                                            <MobileGoogleSignIn />

                                            <div className="pt-4 text-center border-t border-white/5">
                                                <p className="text-xs text-white/40 mb-3">{t('dont_have_account')}</p>
                                                <button
                                                    onClick={() => setView("register")}
                                                    className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-95 text-xs shadow-lg"
                                                >
                                                    {t('sign_up')}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {view === "register" && (
                                        <motion.div
                                            key="register"
                                            initial={{ x: 20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -20, opacity: 0 }}
                                            className="w-full space-y-4"
                                        >
                                            <div className="space-y-1">
                                                <h2 className="text-xl font-bold text-white leading-tight">
                                                    {t('join') || "Join"} Geogram
                                                </h2>
                                                <p className="text-xs text-white/60">{t('register_desc') || "Create your account"}</p>
                                            </div>

                                            <form onSubmit={handleRegister} className="space-y-3">
                                                {error && <div className="text-[10px] text-red-400 bg-red-900/20 p-2 rounded-lg border border-red-500/20">{error}</div>}
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder={t('email')}
                                                        required
                                                        className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder={t('password')}
                                                        required
                                                        className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4" />
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder={t('confirm_password')}
                                                        required
                                                        className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                                >
                                                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><UserPlus size={18} /> {t('sign_up')}</>}
                                                </button>
                                            </form>

                                            <div className="pt-4 text-center border-t border-white/5">
                                                <p className="text-xs text-white/40 mb-3">{t('already_have_account')}</p>
                                                <button
                                                    onClick={() => setView("login")}
                                                    className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl transition-all active:scale-95 text-xs shadow-lg"
                                                >
                                                    {t('sign_in')}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {view === "success" && (
                                        <motion.div
                                            key="success"
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-full space-y-4 py-4"
                                        >
                                            <div className="flex justify-center">
                                                <div className="p-3 rounded-full bg-green-500/20 text-green-400">
                                                    <CheckCircle2 size={40} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className="text-xl font-bold text-white">{t('check_your_email')}</h2>
                                                <p className="text-xs text-white/60 leading-relaxed px-4">
                                                    {t('verification_link_sent_desc')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setView("login")}
                                                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-sm"
                                            >
                                                {t('back_to_login')}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <p className="text-[10px] text-white/30 pt-2 px-4 leading-relaxed">
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
