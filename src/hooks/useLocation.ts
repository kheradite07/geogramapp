"use client";

import { useState, useEffect } from "react";

type LocationState = {
    location: { lat: number; lng: number } | null;
    error: GeolocationPositionError | null;
    loading: boolean;
};

export function useLocation() {
    const [state, setState] = useState<LocationState>({
        location: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState((s) => ({
                ...s,
                loading: false,
                error: {
                    code: 0,
                    message: "Geolocation not supported",
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3
                } as GeolocationPositionError,
            }));
            return;
        }

        console.log("🌍 Requesting location...");

        // Geolocation options - optimized for iOS Safari
        const options: PositionOptions = {
            enableHighAccuracy: true,  // Request GPS instead of WiFi/cell tower
            timeout: 15000,            // 15 seconds timeout (iOS can be slow)
            maximumAge: 300000         // Cache location for 5 minutes (300000ms)
        };

        const handleSuccess = (position: GeolocationPosition) => {
            console.log("✅ Location obtained:", position.coords.latitude, position.coords.longitude);
            setState({
                location: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                },
                error: null,
                loading: false,
            });
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error("❌ Geolocation error:", error.code, error.message);

            // Provide user-friendly error messages
            let friendlyMessage = error.message;
            if (error.code === error.PERMISSION_DENIED) {
                friendlyMessage = "Location permission denied. Please enable location access in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                friendlyMessage = "Location unavailable. Please check your device settings.";
            } else if (error.code === error.TIMEOUT) {
                friendlyMessage = "Location request timed out. Please try again.";
            }

            setState((s) => ({
                ...s,
                error: {
                    ...error,
                    message: friendlyMessage
                } as GeolocationPositionError,
                loading: false
            }));
        };

        // Request location
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            options
        );

        // Optional: Watch position for continuous updates
        // const watchId = navigator.geolocation.watchPosition(
        //     handleSuccess,
        //     handleError,
        //     options
        // );

        // return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return state;
}
