"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { signIn, signOut } from "next-auth/react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "@/context/LocalizationContext";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useTranslation();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");

            if (code) {
                // IMPORTANT: Sign out of any current session before starting a new one from verification
                try {
                    await signOut({ redirect: false });
                } catch (e) {
                    console.error("Sign out error during callback:", e);
                }

                const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                if (error) {
                    console.error("Auth callback error:", error);
                    setStatus("error");
                    setErrorMsg(error.message);
                } else if (data?.session) {
                    setStatus("success");

                    try {
                        // Sign in to NextAuth with the new token
                        await signIn("supabase-token", {
                            accessToken: data.session.access_token,
                            redirect: false
                        });

                        setTimeout(() => {
                            router.push("/");
                        }, 2000);
                    } catch (signInError) {
                        console.error("Auto-login error:", signInError);
                        setTimeout(() => {
                            router.push("/login?message=verified");
                        }, 2000);
                    }
                }
            } else {
                // If there's no code, we don't try to bridge potentially stale Supabase sessions.
                // We just show an error or check if they're already NextAuth-logged-in (safely).
                setStatus("error");
                setErrorMsg("No verification code found. Please use the link as provided in your email.");
            }
        };

        handleCallback();
    }, [searchParams, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-8 text-center space-y-6 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 bg-black/40">
                {status === "loading" && (
                    <>
                        <Loader2 className="animate-spin h-10 w-10 text-purple-400 mx-auto" />
                        <h2 className="text-xl font-bold text-white">{t('verifying_account') || "Verifying your account..."}</h2>
                        <p className="text-gray-300">{t('please_wait') || "Please wait a moment."}</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="flex justify-center">
                            <div className="p-4 rounded-full bg-green-500/20 text-green-400">
                                <CheckCircle2 size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{t('verified_successfully') || "Verified Successfully!"}</h2>
                        <p className="text-gray-300">{t('redirecting_to_app') || "Redirecting you to the app..."}</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="flex justify-center">
                            <div className="p-4 rounded-full bg-red-500/20 text-red-400">
                                <XCircle size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{t('verification_failed') || "Verification Failed"}</h2>
                        <p className="text-red-400 font-medium">{errorMsg}</p>
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full px-4 py-3 text-sm font-medium text-black bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {t('back_to_login')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <Loader2 className="animate-spin h-10 w-10 text-purple-400" />
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
