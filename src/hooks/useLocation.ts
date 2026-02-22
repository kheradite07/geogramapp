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
                if (!navigator.geolocation) {
                    throw new Error("Geolocation not supported by this browser.");
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
                        console.error("Geolocation error:", error);
                        // Fallback to coarse location if high accuracy fails
                        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
                            navigator.geolocation.getCurrentPosition(
                                (fallbackPos) => {
                                    if (isMounted) {
                                        setState({
                                            location: {
                                                lat: fallbackPos.coords.latitude,
                                                lng: fallbackPos.coords.longitude,
                                            },
                                            error: null,
                                            loading: false,
                                        });
                                    }
                                },
                                (fallbackErr) => {
                                    if (isMounted) {
                                        setState((s) => ({ ...s, error: fallbackErr.message || "Location error", loading: false }));
                                    }
                                },
                                { enableHighAccuracy: false, maximumAge: 300000, timeout: 15000 }
                            );
                        } else {
                            if (isMounted) {
                                setState((s) => ({ ...s, error: error.message || "Location error", loading: false }));
                            }
                        }
                    },
                    { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }
                );
            } catch (error: any) {
                console.error("Location exception:", error);
                if (isMounted) {
                    setState((s) => ({
                        ...s,
                        error: error.message || "Location exception",
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
