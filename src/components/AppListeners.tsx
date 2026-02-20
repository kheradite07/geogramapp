"use client";

import dynamic from "next/dynamic";
import React from "react";

const DeepLinkListener = dynamic(() => import("./DeepLinkListener"), {
    ssr: false,
});

const DeviceDetector = dynamic(() => import("./DeviceDetector"), {
    ssr: false,
});

export default function AppListeners() {
    return (
        <>
            <DeepLinkListener />
            <DeviceDetector />
        </>

    );
}
