"use client";

import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

type LocationState = {
    location: { lat: number; lng: number } | null;
    error: any | null;
    loading: boolean;
};

export function useLocation() {
    const [state, setState] = useState<LocationState>({
        location: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        let isMounted = true;

        const requestLocation = async () => {
            try {
                let platform = 'web';
                try {
                    const { Capacitor } = await import("@capacitor/core");
                    platform = Capacitor.getPlatform();
                } catch (e) { }

                if (platform === 'ios') {
                    // --- iOS MUST USE CAPACITOR NATIVE ---
                    const { Geolocation } = await import("@capacitor/geolocation");

                    let permStatus = await Geolocation.checkPermissions();
                    if (permStatus.location !== 'granted') {
                        permStatus = await Geolocation.requestPermissions();
                    }
                    if (permStatus.location !== 'granted') {
                        throw new Error("Location permission denied by user.");
                    }

                    try {
                        const position = await Geolocation.getCurrentPosition({
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000
                        });
                        if (isMounted) {
                            setState({ location: { lat: position.coords.latitude, lng: position.coords.longitude }, error: null, loading: false });
                        }
                    } catch (highAccErr: any) {
                        try {
                            const fallbackPos = await Geolocation.getCurrentPosition({
                                enableHighAccuracy: false,
                                timeout: 15000,
                                maximumAge: 300000
                            });
                            if (isMounted) {
                                setState({ location: { lat: fallbackPos.coords.latitude, lng: fallbackPos.coords.longitude }, error: null, loading: false });
                            }
                        } catch (fErr: any) {
                            if (isMounted) setState((s) => ({ ...s, error: fErr.message || "iOS Location fallback failed", loading: false }));
                        }
                    }

                } else {
                    // --- ANDROID & WEB CAN USE NAVIGATOR ---
                    if (!navigator.geolocation) {
                        throw new Error("Geolocation not supported by this browser.");
                    }

                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            if (isMounted) {
                                setState({ location: { lat: position.coords.latitude, lng: position.coords.longitude }, error: null, loading: false });
                            }
                        },
                        (error) => {
                            if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
                                navigator.geolocation.getCurrentPosition(
                                    (fallbackPos) => {
                                        if (isMounted) setState({ location: { lat: fallbackPos.coords.latitude, lng: fallbackPos.coords.longitude }, error: null, loading: false });
                                    },
                                    (fallbackErr) => {
                                        if (isMounted) setState((s) => ({ ...s, error: fallbackErr.message || "Android Location fallback failed", loading: false }));
                                    },
                                    { enableHighAccuracy: false, maximumAge: 300000, timeout: 15000 }
                                );
                            } else {
                                if (isMounted) setState((s) => ({ ...s, error: error.message || "Location error", loading: false }));
                            }
                        },
                        { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
                    );
                }
            } catch (error: any) {
                console.error("Location exception:", error);
                if (isMounted) {
                    setState((s) => ({ ...s, error: error.message || "Location exception", loading: false }));
                }
            }
        };

        requestLocation();

        return () => {
            isMounted = false;
        };
    }, []);

    return state;
}
