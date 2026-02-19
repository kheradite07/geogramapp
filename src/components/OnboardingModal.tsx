"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { User, Check, AlertCircle, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslation } from "@/context/LocalizationContext";

export default function OnboardingModal() {
    const { t } = useTranslation();
    const { user, mutate } = useUser();
    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only show if user is logged in but not onboarded
    if (!user || user.isOnboarded) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/users/onboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, username }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile.");
            }

            // Success: Refresh user data
            await mutate();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                className="w-full max-w-md p-8 relative overflow-hidden transition-all duration-300 transform scale-100"
                style={{
                    background: 'rgba(20, 0, 50, 0.6)',
                    backdropFilter: 'blur(30px) saturate(180%)',
                    borderRadius: '32px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                {/* Background decorative styling */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-cyan-500/10 pointer-events-none" />

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/30">
                            <User size={40} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{t('welcome_onboarding')}</h2>
                        <p className="text-white/60 text-sm">{t('onboarding_desc')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 ml-1">{t('full_name')}</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-black/30 transition-all font-medium"
                                placeholder={t('fullname_placeholder')}
                                required
                                minLength={2}
                                maxLength={16}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 ml-1">{t('username')}</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 font-bold">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))}
                                    className="w-full pl-10 pr-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-black/30 transition-all font-medium"
                                    placeholder={t('username_placeholder')}
                                    required
                                    minLength={3}
                                    maxLength={16}
                                />
                            </div>
                            <p className="text-[10px] text-white/40 mt-1.5 ml-2">{t('visible_to_everyone')}</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start space-x-3">
                                <AlertCircle size={20} className="text-red-400 shrink-0" />
                                <p className="text-sm text-red-200 font-medium">{error}</p>
                            </div>
                        )}

                        <div className="pt-2 gap-3 flex flex-col">
                            <button
                                type="submit"
                                disabled={isSubmitting || !fullName || !username}
                                className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-1
                                    ${isSubmitting || !fullName || !username
                                        ? 'bg-white/10 text-white/40 cursor-not-allowed shadow-none'
                                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/40'
                                    }
                                `}
                            >
                                {isSubmitting ? (
                                    <span className="animate-pulse">{t('setting_up')}</span>
                                ) : (
                                    <>
                                        <span>{t('complete_setup')}</span>
                                        <Check size={20} strokeWidth={3} />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => signOut()}
                                className="w-full py-3 rounded-xl font-medium text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                            >
                                <LogOut size={14} />
                                <span>{t('sign_out_cancel')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
