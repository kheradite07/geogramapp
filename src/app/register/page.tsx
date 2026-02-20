"use client";

import { useState } from "react";
import { useTranslation } from "@/context/LocalizationContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
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
                throw new Error(data.error || "Registration failed");
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md p-8 text-center space-y-6 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 bg-black/40">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-500/20 text-green-400">
                            <CheckCircle2 size={48} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{t('check_your_email')}</h2>
                    <p className="text-gray-300">
                        {t('verification_link_sent_desc')}
                    </p>
                    <Link
                        href="/login"
                        className="block w-full px-4 py-3 text-sm font-medium text-black bg-white rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {t('back_to_login')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 space-y-8 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 bg-black/40">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                        {t('join')} <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">geogram</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-200">{t('register_page_desc') || "Create your account to start exploring"}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('confirm_password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition-all bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : t('sign_up')}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-sm text-gray-300">
                        {t('already_have_account')}{" "}
                        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                            {t('sign_in')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
