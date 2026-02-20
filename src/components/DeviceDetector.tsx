"use client";

import { useEffect } from "react";

export default function DeviceDetector() {
    useEffect(() => {
        // Detect Android Capacitor environment
        const isAndroid = /android/i.test(navigator.userAgent);
        const isCapacitor = !!(window as any).Capacitor;

        if (isAndroid && isCapacitor) {
            document.documentElement.classList.add("capacitor-android");
        }
    }, []);

    return null;
}
