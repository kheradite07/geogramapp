"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/LocalizationContext";

export default function MobileGoogleSignIn() {
    const { t } = useTranslation();
    const [isNative, setIsNative] = useState(false);
    const [GoogleAuth, setGoogleAuth] = useState<any>(null);
    const { update } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Build sırasında hata almamak için capacitor kontrolü
        const checkPlatform = async () => {
            try {
                const { Capacitor } = await import("@capacitor/core");
                if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
                    setIsNative(true);
                }
            } catch (e) {
                console.error("Platform check failed", e);
            }
        };
        checkPlatform();
    }, []);

    useEffect(() => {
        if (isNative) {
            // Dynamically import the plugin to avoid build errors
            import("@codetrix-studio/capacitor-google-auth").then(async module => {
                setGoogleAuth(module.GoogleAuth);
                const { Capacitor } = await import("@capacitor/core");
                module.GoogleAuth.initialize({
                    clientId: Capacitor.getPlatform() === 'ios'
                        ? '10634920795-d2h2ehou4mgf1249quh8k109nfr3vkje.apps.googleusercontent.com'
                        : '10634920795-g7kg310rkho5gnlt7hjrcet8fqa8d3rh.apps.googleusercontent.com',
                    scopes: ['profile', 'email'],
                    grantOfflineAccess: true
                });
            }).catch(err => {
                console.error("Failed to load Google Auth plugin", err);
            });
        }
    }, [isNative]);

    const handleNativeLogin = async () => {
        if (!GoogleAuth) return;

        try {
            const googleUser = await GoogleAuth.signIn();
            const idToken = googleUser.authentication.idToken;

            // Sign in using the NextAuth Credentials provider we configured
            const result = await signIn("google-mobile", {
                idToken: idToken,
                callbackUrl: "/",
                redirect: false,
            });

            if (result?.error) {
                alert("Login Failed: " + result.error);
                console.error("Login Error:", result.error);
            } else if (result?.ok) {
                await update(); // Force session update
                router.refresh(); // Refresh server components
                router.replace("/"); // Go to home without reload
            }
        } catch (error: any) {
            console.error("Native Google Sign-In Failed:", error);
            alert("Native Error: " + (error?.message || JSON.stringify(error)));
        }
    };

    // if (!isNative) return null; // REMOVED: We want to show the button on web too for the modal

    const handleClick = () => {
        if (isNative) {
            handleNativeLogin();
        } else {
            signIn("google", { callbackUrl: window.location.origin });
        }
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-black transition-all bg-white/90 rounded-lg hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white shadow-lg backdrop-blur-sm"
        >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                />
                <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                />
                <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                />
                <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                />
            </svg>
            {t('sign_in_with_google')}
        </button>
    );
}
