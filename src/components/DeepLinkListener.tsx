"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useRouter } from "next/navigation";

export default function DeepLinkListener() {
    const router = useRouter();

    useEffect(() => {
        const setupListener = async () => {
            // Only runs if we are in a native app environment
            App.addListener('appUrlOpen', (data: { url: string }) => {
                console.log('App opened with URL:', data.url);

                // Example URL: https://geogramapp.vercel.app/auth/callback?code=xxx
                const url = new URL(data.url);
                const path = url.pathname + url.search;

                if (url.pathname.startsWith('/auth/callback')) {
                    router.push(path);
                }
            });
        };

        setupListener();

        return () => {
            App.removeAllListeners();
        };
    }, [router]);

    return null;
}
