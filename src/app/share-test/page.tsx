"use client";

import { Share as ShareIcon } from "lucide-react";
import Map from "react-map-gl/mapbox";
import { customMapStyle } from "@/lib/mapboxStyle";

export default function ShareTestPage() {
    // Mock Data
    const message = {
        id: "debug-123",
        text: "Polis birini arıyo metrobüs durağında",
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
                            zoom: 12.5
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

                            {/* Vote Pills */}
                            <div className="absolute -right-3 -top-3 flex flex-col gap-2 scale-90 origin-bottom-left">
                                <div className="bg-[#10b981] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                                    <span className="text-[10px]">👍</span> {message.likes || 0}
                                </div>
                            </div>
                            <div className="absolute -right-3 -bottom-3 flex flex-col gap-2 scale-90 origin-top-left">
                                <div className="bg-[#ef4444] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                                    <span className="text-[10px]">👎</span> 0
                                </div>
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

                        {/* Location Text Below Bubble */}
                        <div className="mt-8 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white/60 text-[10px] font-medium flex items-center gap-1">
                            📍 Istanbul, Turkey
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
