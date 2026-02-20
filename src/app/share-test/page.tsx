"use client";

import { Share as ShareIcon, ThumbsUp, ThumbsDown } from "lucide-react";
import Map from "react-map-gl/mapbox";
import { customMapStyle } from "@/lib/mapboxStyle";

export default function ShareTestPage() {
    // Mock Data
    const message = {
        id: "debug-123",
        text: "Lorem ipsum dolor sit amet",
        userName: "şenelimm",
        userImage: "https://github.com/shadcn.png", // Placeholder
        timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
        likes: 12,
        lat: 41.0082,
        lng: 28.9784,
    };

    const isFriend = false; // Toggle to test colors

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 gap-8">
            <h1 className="text-white text-2xl font-bold">Share Card Template Preview</h1>
            <p className="text-white/60">This is exactly how the hidden share card looks before being captured.</p>

            {/* THE VISUAL TEMPLATE (Copied from MessageDetails.tsx) */}
            <div
                id={`share-card-${message.id}`}
                className="w-[360px] h-[640px] relative bg-[#1a0033] flex flex-col overflow-hidden text-white shadow-2xl border border-white/10"
            >
                {/* Background Map - Same as App */}
                <div className="absolute inset-0 z-0">
                    <Map
                        initialViewState={{
                            longitude: message.lng,
                            latitude: message.lat,
                            zoom: 10.5
                        }}
                        mapStyle={customMapStyle as any}
                        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                        attributionControl={false}
                        preserveDrawingBuffer={true}
                        style={{ width: '100%', height: '100%' }}
                        interactive={false}
                    />
                </div>

                {/* Central Content - The Bubble (Exact Replica) */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
                            transform: 'scale(1)',
                            transformOrigin: 'center center'
                        }}
                    >
                        {/* Chat bubble */}
                        <div
                            style={{
                                position: 'relative',
                                maxWidth: '240px',
                                padding: '8px 12px 8px 8px',
                                background: isFriend
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
                                    : 'linear-gradient(135deg, rgba(123, 44, 191, 0.95) 0%, rgba(157, 78, 221, 0.95) 100%)',
                                backdropFilter: 'blur(12px)',
                                borderRadius: '24px',
                                border: isFriend ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(199, 125, 255, 0.3)',
                                boxShadow: isFriend
                                    ? '0 8px 32px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.4)'
                                    : '0 8px 32px rgba(123, 44, 191, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.4)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                            }}
                        >
                            {/* Shine effect */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent)',
                                borderRadius: '24px 24px 0 0',
                                pointerEvents: 'none',
                                zIndex: 0
                            }} />

                            {/* Avatar */}
                            <div className="relative z-10 w-8 h-8 shrink-0">
                                {message.userImage ? (
                                    <img
                                        src={message.userImage}
                                        alt={message.userName}
                                        className="w-full h-full rounded-full object-cover border-2 border-white/20"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full flex items-center justify-center border-2 border-white/20 text-xs font-bold bg-indigo-500">
                                        {message.userName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col relative z-10 min-w-0 flex-1">
                                <span style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.2 }}>
                                    {message.text}
                                </span>
                                <div className="flex items-center mt-0.5 space-x-2">
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                                        {message.userName} • 4h ago
                                    </span>
                                </div>
                            </div>

                            {/* NEW HEART LIKE BUTTON - Matches Map bubble design */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '-6px',
                                    right: '-6px',
                                    zIndex: 100,
                                    display: 'flex',
                                    alignItems: 'center',
                                    minWidth: '28px',
                                    height: '28px',
                                    padding: '0 8px',
                                    borderRadius: '9999px',
                                    background: 'rgba(0,0,0,0.6)',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                    backdropFilter: 'blur(12px)',
                                    gap: '4px'
                                }}
                            >
                                <svg
                                    style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.7)' }}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                {(message.likes || 0) > 0 && (
                                    <span style={{ fontSize: '9px', fontWeight: 900, color: 'white', letterSpacing: '-0.025em' }}>
                                        {message.likes}
                                    </span>
                                )}
                            </div>

                        </div>

                        {/* Tail */}
                        <div style={{
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: isFriend ? '10px solid rgba(5, 150, 105, 0.95)' : '10px solid rgba(157, 78, 221, 0.95)',
                            marginTop: '-1px',
                            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                        }} />


                    </div>

                    {/* Download CTA */}
                    <div className="absolute bottom-12 w-full text-center z-20">
                        <div className="text-2xl font-bold tracking-tighter lowercase" style={{
                            background: 'linear-gradient(to right, #c084fc, #e879f9)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 0 10px rgba(192, 132, 252, 0.5))'
                        }}>
                            geogram
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
