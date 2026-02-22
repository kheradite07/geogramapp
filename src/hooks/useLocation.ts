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
                if (Capacitor.isNativePlatform()) {
                    const { Geolocation } = await import("@capacitor/geolocation");

                    // Request permissions first
                    const permission = await Geolocation.checkPermissions();
                    if (permission.location === 'denied' || permission.location === 'prompt' || permission.location === 'prompt-with-description') {
                        await Geolocation.requestPermissions();
                    }

                    const position = await Geolocation.getCurrentPosition({
                        enableHighAccuracy: true,
                        timeout: 10000
                    });

                    if (isMounted) {
                        setState({
                            location: {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                            },
                            error: null,
                            loading: false,
                        });
                    }
                } else {
                    // Web Fallback
                    if (!navigator.geolocation) {
                        throw new Error("Geolocation not supported");
                    }

                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            if (isMounted) {
                                setState({
                                    location: {
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude,
                                    },
                                    error: null,
                                    loading: false,
                                });
                            }
                        },
                        (error) => {
                            if (isMounted) {
                                setState((s) => ({ ...s, error, loading: false }));
                            }
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                    );
                }
            } catch (error: any) {
                console.error("Location error:", error);
                if (isMounted) {
                    setState((s) => ({
                        ...s,
                        error: error.message || "Location error",
                        loading: false
                    }));
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
