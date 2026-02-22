import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SessionProvider } from "next-auth/react";
import Map from "@/components/Map";
import { ConfigProvider } from "@/context/ConfigContext";
import { UIProvider } from "@/context/UIContext";
import LoginModal from "@/components/LoginModal";
import DebugPanel from "@/components/DebugPanel";
import OnboardingModal from "@/components/OnboardingModal";
import PushNotificationManager from "@/components/PushNotificationManager";
import { LocalizationProvider } from "@/context/LocalizationContext";
import AppListeners from "@/components/AppListeners";
import { LazyMotion, domAnimation } from "framer-motion";

export const metadata: Metadata = {
  title: "geogram",
  description: "Connect with friends on the map",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "geogram",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#1a0033", // Brand Purple
};

import { auth } from "@/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMobileBuild = process.env.MOBILE_BUILD === 'true';
  const session = isMobileBuild ? null : await auth();
  const isAdmin = session?.user?.isAdmin;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} overflow-hidden`}>
        <SessionProvider session={session}>
          <LocalizationProvider>
            <ConfigProvider>
              <UIProvider>
                <LazyMotion features={domAnimation}>
                  {/* Persistent Map Background */}
                  <div className="absolute inset-0 z-0">
                    <Map />
                  </div>

                  {/* Page Content Overlay */}
                  <div className="relative z-10 w-full h-full pointer-events-none">
                    {children}
                  </div>
                </LazyMotion>

                {isAdmin && <DebugPanel />}
                <LoginModal />
                <OnboardingModal />
                <PushNotificationManager />
                <AppListeners />
              </UIProvider>
            </ConfigProvider>
          </LocalizationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
