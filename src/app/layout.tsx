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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} overflow-hidden`}>
        <SessionProvider>
          {/* Persistent Map Background */}
          <div className="absolute inset-0 z-0">
            <Map />
          </div>

          {/* Page Content Overlay */}
          <div className="relative z-10 w-full h-full pointer-events-none">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
