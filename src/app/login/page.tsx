"use client";

import { signIn } from "next-auth/react";
import dynamic from 'next/dynamic';
import { useTranslation } from "@/context/LocalizationContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

const MobileGoogleSignIn = dynamic(() => import('@/components/MobileGoogleSignIn'), {
    ssr: false,
});

export default function LoginPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleEmailLogin = async (e: React.FormEvent) => {
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
            } else {
                router.push("/");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 pointer-events-none data-[overlay]:bg-transparent">
            <div className="w-full max-w-md p-8 space-y-8 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 bg-black/40 pointer-events-auto transition-all hover:bg-black/50">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                        {t('welcome_to')} <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">geogram</span>
                    </h2>
                    <p className="mt-2 text-sm text-gray-200">{t('login_page_desc')}</p>
                </div>

                <div className="space-y-4">
                    <MobileGoogleSignIn />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black/40 px-2 text-gray-400 backdrop-blur-sm">{t('or_continue_with') || "Or continue with"}</span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-3">
                        {error && (
                            <div className="p-3 text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg">
                                {error}
                            </div>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('email') || "Email"}
                                required
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('password') || "Password"}
                                required
                                className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-all bg-purple-600/80 rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-lg disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><LogIn className="h-4 w-4 mr-2" /> {t('sign_in')}</>}
                        </button>
                    </form>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => signIn("google", { callbackUrl: "/" })}
                            className="hidden md:flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-black transition-all bg-white/90 rounded-lg hover:bg-white focus:outline-none shadow-lg backdrop-blur-sm"
                        >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            {t('sign_in_with_google')}
                        </button>

                        <button
                            type="button"
                            onClick={() => signIn("apple", { callbackUrl: "/" })}
                            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition-all bg-black/80 rounded-lg hover:bg-black focus:outline-none shadow-lg backdrop-blur-sm border border-white/10"
                        >
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 3.65-1.02 1.35.05 2.17.65 2.62 1.01-4.04 1.76-3.3 5.48-.35 7.15-1.9 2.57-2.8 4.67-4.49 5.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            {t('sign_in_with_apple')}
                        </button>
                    </div>

                    <div className="text-center pt-2">
                        <p className="text-sm text-gray-300">
                            {t('dont_have_account') || "Don't have an account?"}{" "}
                            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center">
                                <UserPlus className="h-4 w-4 mr-1" /> {t('sign_up')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
