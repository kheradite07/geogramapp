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
import DebugPanel from "@/components/DebugPanel";
import OnboardingModal from "@/components/OnboardingModal";

export const metadata: Metadata = {
  title: "geogram",
  description: "Connect with friends on the map",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} overflow-hidden`}>
        <SessionProvider>
          <ConfigProvider>
            <UIProvider>
              {/* Persistent Map Background */}
              <div className="absolute inset-0 z-0">
                <Map />
              </div>

              {/* Page Content Overlay */}
              <div className="relative z-10 w-full h-full pointer-events-none">
                {children}
              </div>

              <DebugPanel />
              <OnboardingModal />
            </UIProvider>
          </ConfigProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
