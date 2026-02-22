"use client";

import MapGL, { Marker, NavigationControl, GeolocateControl, MapRef, Source, Layer } from "react-map-gl/mapbox";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/hooks/useLocation";
import { useMessages } from "@/hooks/useMessages";
import { customMapStyle, FOG_CONFIG, COLORS } from "@/lib/mapboxStyle";
import { useConfig } from "@/context/ConfigContext";
import { Message } from "@/lib/store";
import { useSession } from "next-auth/react";
import { useUser } from "@/hooks/useUser";
import { useUI } from "@/context/UIContext";
import { UserPlus, Check, Clock, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { m, AnimatePresence, animate, useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";
import { memo } from "react";
import throttle from "lodash/throttle";
import MessageDetails from "./MessageDetails";
import { BADGE_CONFIGS } from "@/lib/badgeConfig";

import VoteControls from "./VoteControls";
import MapLayers, { FilterMode } from "./MapLayers";
import { useTranslation } from "@/context/LocalizationContext";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// --- PHASE 4: DEVICE PIXEL RATIO (DPI) CLAMPING (MODULE LEVEL) ---
// We execute this immediately upon script load (before React Map GL mounts and reads it).
if (typeof window !== 'undefined') {
    const isAndroid = /android/i.test(navigator.userAgent);
    // Removed `!!window.Capacitor` check because Capacitor might not be fully injected
    // at the very millisecond this file is parsed, but the Android UserAgent is always present.
    if (isAndroid && window.devicePixelRatio > 1.5) {
        console.log(`[Phase 4] EARLY Clamping DPI from ${window.devicePixelRatio} to 1.5 for Mapbox WebView performance`);
        try {
            Object.defineProperty(window, 'devicePixelRatio', {
                get: function () {
                    return 1.5;
                },
                configurable: true // allow re-definition if necessary
            });
        } catch (e) {
            console.error("Could not override devicePixelRatio:", e);
        }
    }
}
// -----------------------------------------------------------------

// Helper for relative time
const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    // Minutes
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;

    // Hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    // Days
    const days = Math.floor(hours / 24);
    return `${days}d`;
};


const UserAura = () => (
    <>
        <div className="absolute inset-0 bg-green-400/50 rounded-full animate-ping pointer-events-none"></div>
        <div className="absolute inset-0 bg-green-400/20 rounded-full animate-pulse blur-md pointer-events-none"></div>
        <div className="absolute -inset-2 bg-green-500/10 rounded-full animate-pulse blur-xl pointer-events-none"></div>
    </>
);

// Custom User Location Marker Component
const UserLocationMarker = memo(({ image, name }: { image?: string | null, name?: string | null }) => (
    <div className="relative flex items-center justify-center w-10 h-10 cursor-default pointer-events-none">
        <UserAura />

        {/* Avatar Container */}
        <div className="relative w-8 h-8 rounded-full border-2 border-white shadow-[0_0_20px_rgba(34,197,94,0.6)] overflow-hidden bg-green-950 flex items-center justify-center">
            {image ? (
                <img src={image} alt={name || "You"} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold text-sm">
                    {name?.charAt(0).toUpperCase() || "U"}
                </div>
            )}
        </div>
    </div>
));
UserLocationMarker.displayName = 'UserLocationMarker';

const FriendMarker = memo(({ friend, onClick, showAura }: { friend: any, onClick?: () => void, showAura?: boolean }) => (
    <div className="group relative cursor-pointer" onClick={(e) => {
        e.stopPropagation();
        onClick?.();
    }}>
        <div className="relative flex items-center justify-center w-10 h-10">
            {showAura && <UserAura />}

            <div className={`w-10 h-10 rounded-full border-2 ${showAura ? 'border-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-green-500'} shadow-lg overflow-hidden bg-black relative transform transition-transform group-hover:scale-110`}>
                {friend.image ? (
                    <img src={friend.image} alt={friend.name} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${showAura ? 'bg-emerald-600' : 'bg-green-600'} text-white font-bold`}>
                        {friend.name?.charAt(0).toUpperCase() || (showAura ? 'U' : '?')}
                    </div>
                )}
            </div>

            {!showAura && (
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${friend.lastSeen && (Date.now() - new Date(friend.lastSeen).getTime() < 5 * 60 * 1000)
                    ? 'bg-green-500'
                    : 'bg-gray-500'
                    }`}></div>
            )}
        </div>
        {/* Tooltip */}
        <div className="absolute top-full mt-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center whitespace-nowrap pointer-events-none z-[1000]">
            <span className="text-[10px] text-white font-medium">{isSelf(friend) ? 'You' : friend.name}</span>
            {!isSelf(friend) && friend.lastSeen && (
                <span className="text-[9px] text-gray-300">
                    {Date.now() - new Date(friend.lastSeen).getTime() < 5 * 60 * 1000
                        ? 'Online'
                        : `Seen ${formatRelativeTime(new Date(friend.lastSeen).getTime())} ago`}
                </span>
            )}
        </div>
    </div>
));
FriendMarker.displayName = 'FriendMarker';

const isSelf = (point: any) => point.id === 'self' || point.isSelf;

// Orbital Layout Constants
const ORBITAL_RADIUS = 32; // Distance from center
const THRESHOLD_ZOOM_DECLUSTER = 18.2; // Zoom level where we show individual markers instead of just avatars

const FriendClusterMarker = memo(({ count, friends, onClick, stackIndex = 0 }: { count: number, friends: any[], onClick?: () => void, stackIndex?: number }) => {
    // Each person is an individual marker. The leader (index 0) stays at center.
    // Others orbit around at a smaller scale.
    const person = friends[0];
    const isUser = isSelf(person);

    const isLeader = stackIndex === 0;

    let translateX = 0;
    let translateY = 0;
    let scale = 1.0;

    if (!isLeader) {
        // Calculate orbital position based on index (offset from leader)
        const followerIndex = stackIndex - 1;
        const totalFollowers = Math.max(count - 1, 1);

        // Distribute followers evenly around the circle
        // Start from -90deg (top) for better visual balance
        const angle = (followerIndex * (360 / totalFollowers) - 90) * (Math.PI / 180);

        translateX = Math.cos(angle) * ORBITAL_RADIUS;
        translateY = Math.sin(angle) * ORBITAL_RADIUS;
        scale = 0.8; // Orbital avatars are slightly larger for symmetry
    }

    return (
        <div
            className="group relative cursor-pointer flex items-center justify-center"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            style={{
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                zIndex: isLeader ? 100 : 10 - stackIndex,
            }}
        >
            <div className={`relative flex items-center justify-center ${isLeader ? 'w-10 h-10' : 'w-8 h-8'}`}>
                {isUser && <UserAura />}
                <div className={`${isLeader ? 'w-10 h-10' : 'w-8 h-8'} rounded-full border-2 ${isUser ? 'border-white shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'border-green-500'} shadow-lg overflow-hidden bg-black transform transition-transform group-hover:scale-110 ring-4 ring-black/20`}>
                    {person.image ? (
                        <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isUser ? 'bg-emerald-600' : 'bg-green-600'} text-white font-bold text-xs`}>
                            {person.name?.charAt(0).toUpperCase() || (isUser ? 'U' : '?')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
FriendClusterMarker.displayName = 'FriendClusterMarker';


// Smoothly Animated Marker Wrapper
const AnimatedMarker = memo(({ latitude, longitude, children, zIndex = 0, layoutId, ...props }: any) => {
    // Motion values for momentum preservation
    const latMV = useMotionValue(latitude);
    const lngMV = useMotionValue(longitude);

    // Spring configuration for snappy, organic movement
    const springConfig = { stiffness: 400, damping: 40, mass: 1 };
    const latSpring = useSpring(latMV, springConfig);
    const lngSpring = useSpring(lngMV, springConfig);

    // Current rendered coordinates (synced with spring)
    const [coords, setCoords] = useState({ lat: latitude, lng: longitude });

    // Update target when props change - useSpring handles the transition smoothly
    useEffect(() => {
        latMV.set(latitude);
        lngMV.set(longitude);
    }, [latitude, longitude]);

    // Sync spring values back to state for react-map-gl Marker
    useMotionValueEvent(latSpring, "change", (latest) => {
        setCoords(prev => ({ ...prev, lat: latest }));
    });
    useMotionValueEvent(lngSpring, "change", (latest) => {
        setCoords(prev => ({ ...prev, lng: latest }));
    });

    return (
        <Marker {...props} latitude={coords.lat} longitude={coords.lng} style={{ transition: 'none', zIndex }}>
            <m.div
                layoutId={layoutId}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={{ willChange: 'transform' }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                    mass: 0.5
                }}
            >
                {children}
            </m.div>
        </Marker>
    );
});
AnimatedMarker.displayName = 'AnimatedMarker';


// Helper: Collision Avoidance (Reverse Magnet)
// Represents a point on the map that pushes others away
type Repellor = {
    lat: number;
    lng: number;
    radiusLat: number;
    radiusLng: number;
    strength: number; // 0 to 1
    id?: string;
};

// Pushes a coordinate away from multiple repellors with smooth force
const applyRepulsion = (
    lat: number,
    lng: number,
    originalLat: number,
    originalLng: number,
    repellors: Repellor[],
    zoom: number,
    ignoreExactMatches: boolean = true
) => {
    // Zoom bypass: don't move anything at world scale to preserve geographical integrity
    if (zoom < 8) return { lat: originalLat, lng: originalLng };

    let finalLat = lat;
    let finalLng = lng;

    repellors.forEach(r => {
        // Skip repulsion if the point is exactly at the anchor (to keep marker tip locked)
        if (ignoreExactMatches && Math.abs(lat - r.lat) < 0.000001 && Math.abs(lng - r.lng) < 0.000001) {
            return;
        }

        // Shift repulsion center upwards because bubble/marker is usually anchored at bottom
        // Clusters/Dots use center, but Bubbles (strength=1.0) use a shifted center
        const centerLat = r.strength > 0.8 ? r.lat + (r.radiusLat * 0.7) : r.lat;

        const dLat = finalLat - centerLat;
        const dLng = finalLng - r.lng;

        // Normalize by margins to check if inside the "force field"
        const normLat = dLat / r.radiusLat;
        const normLng = dLng / r.radiusLng;
        const distSq = normLat * normLat + normLng * normLng;

        if (distSq < 1.0 && distSq > 0.0000001) {
            const dist = Math.sqrt(distSq);

            if (r.strength > 0.8) {
                // HARD EXCLUSION for Bubbles: force to edge immediately
                const hardPush = (1.05 / dist);
                finalLat = centerLat + (dLat * hardPush);
                finalLng = r.lng + (dLng * hardPush);
            } else {
                // SOFT PUSH for Clusters/Dots
                const force = (1.1 - dist) * r.strength;
                const pushFactor = Math.min(1.2, force * 0.4);
                finalLat += (dLat / dist) * pushFactor * r.radiusLat;
                finalLng += (dLng / dist) * pushFactor * r.radiusLng;
            }
        }
    });

    // --- ORIGIN ANCHORING (Max 40px shift from original average) ---
    // 40 pixels at zoom z: 40 * (360 / (512 * 2^z)) = 28.125 / 2^z
    const maxShift = (28.125) / Math.pow(2, zoom);
    const dLatTotal = finalLat - originalLat;
    const dLngTotal = finalLng - originalLng;
    const distTotalSq = dLatTotal * dLatTotal + dLngTotal * dLngTotal;

    if (distTotalSq > maxShift * maxShift) {
        const distTotal = Math.sqrt(distTotalSq);
        const scale = maxShift / distTotal;
        finalLat = originalLat + dLatTotal * scale;
        finalLng = originalLng + dLngTotal * scale;
    }

    // --- RE-ENFORCE HARD EXCLUSION (Zero Tolerance) ---
    // Ensure anchoring didn't push us back into a bubble
    repellors.filter(r => r.strength > 0.8).forEach(r => {
        const centerLat = r.lat + (r.radiusLat * 0.7);
        const dLat = finalLat - centerLat;
        const dLng = finalLng - r.lng;
        const normLat = dLat / r.radiusLat;
        const normLng = dLng / r.radiusLng;
        const distSq = normLat * normLat + normLng * normLng;
        if (distSq < 1.0 && distSq > 0.0000001) {
            const dist = Math.sqrt(distSq);
            const hardPush = (1.05 / dist);
            finalLat = centerLat + (dLat * hardPush);
            finalLng = r.lng + (dLng * hardPush);
        }
    });

    // CRITICAL: Prevent "Invalid LngLat" errors by clamping coordinates
    finalLat = Math.max(-89.9999, Math.min(89.9999, finalLat));

    // Normalize Longitude to [-180, 180] range
    while (finalLng > 180) finalLng -= 360;
    return { lat: finalLat, lng: finalLng };
};

const getNotchAngle = (lat: number, lng: number, origLat: number, origLng: number) => {
    const dy = origLat - lat;
    const dx = origLng - lng;
    return (Math.atan2(dy, dx) * 180 / Math.PI) * -1;
};

const getPixelDistance = (lat1: number, lng1: number, lat2: number, lng2: number, zoom: number) => {
    const pixelsPerDegree = (512 * Math.pow(2, zoom)) / 360;
    const dy = (lat1 - lat2) * pixelsPerDegree;
    const dx = (lng1 - lng2) * pixelsPerDegree * Math.cos(lat1 * Math.PI / 180);
    return Math.sqrt(dx * dx + dy * dy);
};






// Message Marker Component
// Premium Message Bubble Component
// --- Configuration ---
const FOCUS_CONFIG = {
    verticalBand: 0.45,   // Total height percentage (0.35 = 35% of screen)
    horizontalBand: 0.45, // Total width percentage (0.20 = 20% of screen)
};

const MessageMarker = ({
    message,
    onClick,
    onVote,
    currentUser,
    unlimitedVotes = false,
    isSelected = false,
    isNearCenter = true,
    showActions = false, // Controlled by parent based on screen center proximity
    zoom = 12,
    isExiting = false
}: {
    message: Message & { hiddenCount?: number };
    onClick?: (e?: React.MouseEvent) => void;
    onVote?: (id: string, action: 'like' | 'dislike', unlimited: boolean) => void;
    currentUser?: any;
    unlimitedVotes?: boolean;
    isSelected?: boolean;
    isNearCenter?: boolean;
    showActions?: boolean;
    zoom?: number;
    isExiting?: boolean;
}) => {
    // Animation state to prevent re-triggering classes on every render
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        setIsVisible(true);
    }, []);

    const { t } = useTranslation();


    // Determine display mode:
    // 1. Rely solely on clustering logic (passed as isNearCenter)
    const shouldShowAsBubble = isNearCenter;
    const showAsDot = !shouldShowAsBubble;

    if (showAsDot) {
        return (
            <div
                onClick={onClick}
                className="cursor-pointer group pointer-events-auto"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div className="relative">
                    {/* Larger, more prominent dot */}
                    <div
                        className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all hover:scale-150"
                        style={{
                            background: message.visibility === 'friends'
                                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                        }}
                    />
                </div>
            </div>
        );
    }

    const isFriends = message.visibility === 'friends';
    const isFriendUser = currentUser?.friends?.some((f: any) => f.id === message.userId) || false;

    // CSS Variables for dynamic coloring
    const isPremium = message.userIsPremium; // Assumes we add this field to message/user store or API response

    const bubbleStyle = {
        '--bubble-bg': isFriends
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
            : isPremium
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.9) 0%, rgba(218, 165, 32, 0.9) 100%)' // Premium Gold
                : 'linear-gradient(135deg, rgba(123, 44, 191, 0.95) 0%, rgba(157, 78, 221, 0.95) 100%)',
        '--bubble-border': isFriends
            ? '1px solid rgba(52, 211, 153, 0.3)'
            : isPremium
                ? '1px solid rgba(255, 223, 0, 0.6)' // Premium Gold Border
                : '1px solid rgba(199, 125, 255, 0.3)',
        '--bubble-shadow': isFriends
            ? '0 8px 32px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : isPremium
                ? '0 8px 32px rgba(255, 215, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)' // Gold Glow
                : '0 8px 32px rgba(123, 44, 191, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        '--bubble-shadow-hover': isFriends
            ? '0 12px 40px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            : isPremium
                ? '0 12px 40px rgba(255, 215, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.5)' // Stronger Gold Glow
                : '0 12px 40px rgba(157, 78, 221, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        '--tail-color': isFriends
            ? 'rgba(5, 150, 105, 0.95)'
            : isPremium
                ? 'rgba(218, 165, 32, 0.9)'
                : 'rgba(157, 78, 221, 0.95)',
        '--outline': 'none',
        zIndex: (isFriends ? 1000 : isPremium ? 500 : 0) + (message.likes || 0) + 10,
        // Combined Scale/Opacity logic
        opacity: (isVisible && !isExiting) ? 1 : 0,
        transform: (isVisible && !isExiting) ? 'scale(1)' : 'scale(0)',
        transformOrigin: 'bottom center',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease'
    } as React.CSSProperties;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}
            className="cursor-pointer group pointer-events-auto message-container"
            style={bubbleStyle}
        >
            <div className="relative">
                {/* Own-post 'You' badge - Top Center */}
                {currentUser?.id === message.userId && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '-18px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 110,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'rgba(0,0,0,0.55)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.35)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                            flexShrink: 0
                        }} />
                        <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.9)',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            {t("you_badge") || "You"}
                        </span>
                    </div>
                )}

                {/* Chat bubble */}
                <div className="message-bubble">
                    {/* Clustering Badge - Top Left - Larger */}
                    {(message.hiddenCount ?? 0) > 0 && (
                        <div className="absolute -top-3 -left-3 bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full border-2 border-purple-900 shadow-lg z-10">
                            +{message.hiddenCount}
                        </div>
                    )}

                    {/* Shine effect */}
                    <div className="bubble-shine" />

                    {/* User Avatar - Hide if anonymous */}
                    {!message.isAnonymous && (
                        <div className="relative z-10 w-8 h-8 shrink-0 message-avatar">
                            {/* Premium Crown - Absolute Position Top Right of Avatar */}
                            {isPremium && !message.activeBadgeId && (
                                <div className="absolute -top-1.5 -right-1.5 z-20 bg-yellow-400 text-yellow-900 rounded-full w-4 h-4 flex items-center justify-center shadow-md animate-bounce-slow border border-white">
                                    <span className="text-[10px]">👑</span>
                                </div>
                            )}

                            {/* Active User Badge - Absolute Position Top Right of Avatar */}
                            {message.activeBadgeId && BADGE_CONFIGS[message.activeBadgeId] && (
                                <div
                                    title={t(BADGE_CONFIGS[message.activeBadgeId].nameKey)}
                                    className={`absolute -top-2 -right-2 z-20 flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br ${BADGE_CONFIGS[message.activeBadgeId].style} text-[10px] shadow-sm transform rotate-12 ring-1 ring-white/20`}
                                >
                                    {BADGE_CONFIGS[message.activeBadgeId].icon}
                                </div>
                            )}

                            {message.userImage ? (
                                <img
                                    src={message.userImage}
                                    alt={message.userName}
                                    className={`w-full h-full rounded-full object-cover border-2 ${isPremium ? 'border-yellow-400' : isFriendUser ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-white/20'}`}
                                />
                            ) : (
                                <div className={`w-full h-full rounded-full flex items-center justify-center border-2 text-xs font-bold ${isPremium ? 'bg-gradient-to-br from-yellow-500 to-orange-500 border-yellow-300' : isFriendUser ? 'bg-green-600 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-indigo-500 border-white/20'}`}>
                                    {message.userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex flex-col relative z-10 min-w-0 flex-1 message-content pr-5">
                        <span className="message-text">
                            {message.text}
                        </span>
                        <div className="flex items-center mt-0.5 space-x-2">
                            <span className="message-meta">
                                {!message.isAnonymous && <>{message.userName} • </>}
                                {formatRelativeTime(message.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* PREMIUM DIRECT LIKE BUTTON - Bottom Right Corner */}
                {showActions && !isExiting && (
                    <div className="absolute -bottom-1.5 -right-1.5 z-[100] flex items-center">
                        <m.button
                            initial={false}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onVote?.(message.id, 'like', unlimitedVotes);
                            }}
                            className={`relative flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full border border-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-colors duration-500 gap-1 overflow-hidden group ${message.likedBy?.includes(currentUser?.id)
                                ? 'bg-gradient-to-br from-pink-500 to-rose-600 border-white/60 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                                : 'bg-black/60 hover:bg-black/80'
                                }`}
                        >
                            {/* Splash Ripple Effect */}
                            {message.likedBy?.includes(currentUser?.id) && (
                                <m.div
                                    initial={{ scale: 0, opacity: 0.5 }}
                                    animate={{ scale: 3, opacity: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="absolute inset-0 bg-white rounded-full pointer-events-none"
                                />
                            )}

                            {/* Heart Icon with Heartbeat */}
                            <m.div
                                animate={message.likedBy?.includes(currentUser?.id) ? {
                                    scale: [1, 1.2, 1],
                                } : { scale: 1 }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    repeatDelay: 1
                                }}
                            >
                                <svg
                                    className={`w-3 h-3 transition-colors duration-300 ${message.likedBy?.includes(currentUser?.id) ? 'text-white' : 'text-white/70'}`}
                                    fill={message.likedBy?.includes(currentUser?.id) ? "white" : "none"}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={message.likedBy?.includes(currentUser?.id) ? 0 : 2}
                                >
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </m.div>

                            {/* Animated Like Count */}
                            <AnimatePresence mode="wait">
                                {(message.likes || 0) > 0 && (
                                    <m.span
                                        key={message.likes}
                                        initial={{ y: 5, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -5, opacity: 0 }}
                                        className="text-[9px] font-black text-white pr-0.5 tracking-tight"
                                    >
                                        {message.likes}
                                    </m.span>
                                )}
                            </AnimatePresence>
                        </m.button>
                    </div>
                )}
            </div>

            {/* Tail/pointer */}
            <div className="bubble-tail" />

            <style jsx>{`
                .message-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
                    z-index: var(--zIndex);
                }

                .message-bubble {
                    position: relative;
                    max-width: 240px;
                    padding: 8px 12px 8px 8px;
                    background: var(--bubble-bg);
                    backdrop-filter: blur(12px);
                    border-radius: 24px;
                    border: var(--bubble-border);
                    box-shadow: var(--bubble-shadow);
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
                    outline: var(--outline);
                    outline-offset: 2px;
                    /* More visible white outline for contrast against purple map */
                    z-index: 10; /* Ensure bubble is on top of sidebar */
                }

                /* Disable expensive blur on Android WebViews for major performance boost */
                @supports (-webkit-touch-callout: none) == false {
                    .capacitor-android .message-bubble {
                        backdrop-filter: none;
                        background: rgba(30,30,30,0.9); /* Solid fallback */
                    }
                }

                .message-bubble:hover {

                    transform: translateY(-4px) scale(1.05);
                    box-shadow: var(--bubble-shadow-hover);
                }

                .bubble-shine {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 50%;
                    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent);
                    border-radius: 24px 24px 0 0;
                    pointer-events: none;
                    z-index: 0;
                }

                .bubble-tail {
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 10px solid var(--tail-color);
                    margin-top: -1px;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
                }

                .message-text {
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.2;
                }

                .message-meta {
                    font-size: 10px;
                    color: rgba(255,255,255,0.7);
                    font-weight: 600;
                }

                .vote-animate {
                    animation: voteClick 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes voteClick {
                    0% { transform: scale(1); }
                    25% { transform: scale(1.3) rotate(-10deg); }
                    50% { transform: scale(1.1) rotate(5deg); }
                    75% { transform: scale(1.15) rotate(-3deg); }
                    100% { transform: scale(1); }
                }

                @media (max-width: 768px) {
                    .message-bubble {
                        max-width: 180px !important;
                        padding: 6px 10px 6px 6px !important;
                        gap: 8px !important;
                    }
                    .message-avatar {
                        width: 28px !important;
                        height: 28px !important;
                    }
                    .message-text {
                        font-size: 12px !important;
                    }
                    .message-meta {
                        font-size: 9px !important;
                    }
                    .vote-badge {
                .vote-badge svg {
                        width: 10px !important;
                        height: 10px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default function MapComponent() {
    const router = useRouter();

    // --- MAP PROJECTION (2D / 3D) ---
    // Persisted in localStorage so the setting survives reloads.
    // SettingsView writes 'mercator' or 'globe' to this key.
    const [mapProjection, setMapProjection] = useState<'globe' | 'mercator'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('geogram_map_projection');
            return saved === 'mercator' ? 'mercator' : 'globe';
        }
        return 'globe';
    });

    // Listen for settings changes from SettingsView (same-tab StorageEvent dispatch)
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'geogram_map_projection') {
                setMapProjection(e.newValue === 'mercator' ? 'mercator' : 'globe');
            }
            if (e.key === 'geogram_map_buildings') {
                setShow3DBuildings(e.newValue !== 'false');
            }
            if (e.key === 'geogram_map_terrain') {
                setShow3DTerrain(e.newValue === 'true');
            }
            if (e.key === 'geogram_map_poi') {
                setShowPOI(e.newValue === 'true');
            }
            if (e.key === 'geogram_map_transit') {
                setShowTransit(e.newValue === 'true');
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // 3D Buildings toggle
    const [show3DBuildings, setShow3DBuildings] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_buildings') !== 'false';
        }
        return true;
    });

    // 3D Terrain toggle
    const [show3DTerrain, setShow3DTerrain] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_terrain') === 'true';
        }
        return false;
    });

    // POI & Place Labels toggle
    const [showPOI, setShowPOI] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_poi') === 'true';
        }
        return false;
    });

    // Road & Transit Network toggle
    const [showTransit, setShowTransit] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('geogram_map_transit') === 'true';
        }
        return false;
    });

    const { t } = useTranslation();
    const { location, error: locationError } = useLocation();
    const { messages, voteMessage, deleteMessage } = useMessages();
    const mapRef = useRef<MapRef>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);


    // --- CONSOLIDATED MAP SETTINGS SYNC ---
    const syncMapSettings = useMemo(() => {
        return () => {
            const map = mapRef.current?.getMap();
            if (!map || !isMapLoaded) return;

            try {
                // Projection
                map.setProjection(mapProjection as any);

                // 3D Buildings
                const buildVis = show3DBuildings ? 'visible' : 'none';
                if (map.getLayer('building-3d')) map.setLayoutProperty('building-3d', 'visibility', buildVis);

                // POI & Place Labels
                const poiVis = showPOI ? 'visible' : 'none';
                if (map.getLayer('poi-label-general')) map.setLayoutProperty('poi-label-general', 'visibility', poiVis);

                // Settlement labels should stay visible for navigation
                if (map.getLayer('place-city-major')) map.setLayoutProperty('place-city-major', 'visibility', 'visible');
                if (map.getLayer('place-town')) map.setLayoutProperty('place-town', 'visibility', 'visible');
                if (map.getLayer('place-neighborhood')) map.setLayoutProperty('place-neighborhood', 'visibility', 'visible');

                // Road & Transit Network
                const transitVis = showTransit ? 'visible' : 'none';
                if (map.getLayer('aeroway-area')) map.setLayoutProperty('aeroway-area', 'visibility', transitVis);
                if (map.getLayer('aeroway-line')) map.setLayoutProperty('aeroway-line', 'visibility', transitVis);
                if (map.getLayer('transit-railway')) map.setLayoutProperty('transit-railway', 'visibility', transitVis);
                if (map.getLayer('airport-label')) map.setLayoutProperty('airport-label', 'visibility', transitVis);
                if (map.getLayer('transit-stop-label')) map.setLayoutProperty('transit-stop-label', 'visibility', transitVis);

                // Terrain
                if (show3DTerrain) {
                    if (!map.getSource('mapbox-dem')) {
                        map.addSource('mapbox-dem', {
                            type: 'raster-dem',
                            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                            tileSize: 512,
                            maxzoom: 14
                        });
                    }
                    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
                } else {
                    map.setTerrain(null as any);
                }
            } catch (e) { console.warn("Sync map settings error:", e); }
        };
    }, [isMapLoaded, mapProjection, show3DBuildings, showPOI, showTransit, show3DTerrain]);

    // Apply sync whenever states or map load status change
    useEffect(() => {
        syncMapSettings();
    }, [syncMapSettings]);
    // ---------------------------------------------------
    const { data: session } = useSession();

    const [viewState, setViewState] = useState({
        latitude: 20, // World centerish
        longitude: 0,
        zoom: 2, // Start zoomed out (Space/World view)
    });

    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [detailsMessage, setDetailsMessage] = useState<Message | null>(null);
    const [selectedFriend, setSelectedFriend] = useState<any | null>(null);

    // Track programmatic movements to avoid closing popup during flyTo
    const isProgrammaticMove = useRef(false);

    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [activeGroupIndex, setActiveGroupIndex] = useState<Record<string, number>>({});
    const [locationName, setLocationName] = useState<string | null>(null);

    const { expirationHours, minLikesForZoom, isSimulationMode, unlimitedVotes, clusterRadius } = useConfig();
    const { user: currentUserData, handleFriendRequest } = useUser();
    const { isMessageDetailsOpen, setMessageDetailsOpen, triggerLocationFocus, focusedLocation, setFocusedLocation } = useUI();

    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [isLayersOpen, setIsLayersOpen] = useState(false);

    // Track exiting bubbles for closing animation
    const [exitingBubbles, setExitingBubbles] = useState<Record<string, Message>>({});
    const previousBubblesSet = useRef<Set<string>>(new Set());

    // Helper to check friend status
    const getFriendStatus = (targetUserId: string) => {
        if (!currentUserData) return 'none';
        if (currentUserData.friends.some(f => f.id === targetUserId)) return 'friend';
        if (currentUserData.friendRequests.outgoing.some(f => f.id === targetUserId)) return 'sent';
        if (currentUserData.friendRequests.incoming.some(f => f.id === targetUserId)) return 'received';
        if (currentUserData.id === targetUserId) return 'self';
        return 'none';
    };

    const onAddFriend = async (targetUserId: string) => {
        if (!currentUserData) return;
        await handleFriendRequest(targetUserId, 'send');
    };


    // Update Location - Use GPS exclusively
    useEffect(() => {
        const interval = setInterval(() => {
            if (currentUserData && location) {
                // Use actual GPS location from useLocation hook
                fetch('/api/users/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: location.lat,
                        lng: location.lng
                    })
                }).catch(err => console.error("Location update failed", err));
            }
        }, 10000); // Every 10 seconds

        return () => clearInterval(interval);
    }, [currentUserData, location]);

    // Update selected message if it's updated in the global list
    useEffect(() => {
        if (selectedMessage) {
            const updated = messages.find(m => m.id === selectedMessage.id);
            if (updated) {
                setSelectedMessage(updated);
            }
        }
    }, [messages, selectedMessage?.id]);

    // Viewport bounds for optimization
    const [viewportBounds, setViewportBounds] = useState<mapboxgl.LngLatBounds | null>(null);

    // Track if we have already centered on user location to prevent loops
    const hasCentered = useRef(false);

    // REMOVED: Do not restore state from localStorage. Always start from World View.
    // useEffect(() => { ... }, []); 


    // Force Center on User Location when available (Initial Load Only)
    // AND wait for map to be loaded
    useEffect(() => {
        if (location && isMapLoaded && !hasCentered.current) {
            console.log("📍 Centering map on user location (FlyTo):", location);

            // Fly down to the user's location from the initial World View
            if (mapRef.current) {
                mapRef.current.flyTo({
                    center: [location.lng, location.lat],
                    zoom: 12, // Target zoom
                    duration: 3500, // Cinematic flight
                    essential: true
                });
                hasCentered.current = true;
            }
        }
    }, [location, isMapLoaded]);

    // Listen for manual location focus trigger
    useEffect(() => {
        if (triggerLocationFocus > 0 && location && mapRef.current) {
            console.log("📍 Manual FlyTo Triggered");

            // Close any open message details to reset UI state
            setSelectedMessage(null);
            setMessageDetailsOpen(false);

            mapRef.current.flyTo({
                center: [location.lng, location.lat],
                zoom: 15, // Closer zoom for manual focus
                padding: { top: 0, bottom: 0, left: 0, right: 0 }, // Reset any padding (especially from message details)
                speed: 1.5,
                curve: 1.42,
                essential: true
            });
        }
    }, [triggerLocationFocus, location]);

    // Listen for focused location trigger (from ActivePosts etc)
    useEffect(() => {
        if (focusedLocation && mapRef.current) {
            console.log("📍 Focused Location FlyTo Triggered:", focusedLocation);

            // Close any open message details if necessary, 
            // but might want to keep it open if we're flying to a specific post?
            // For now, let's keep it simple.

            mapRef.current.flyTo({
                center: [focusedLocation.lng, focusedLocation.lat],
                zoom: focusedLocation.zoom || 15,
                padding: { top: 0, bottom: 0, left: 0, right: 0 },
                speed: 1.5,
                curve: 1.42,
                essential: true
            });

            // Reset after move
            setFocusedLocation(null);
        }
    }, [focusedLocation]);

    // Save Map State on Move
    const handleMoveStart = (evt: any) => {
        // Reset carousel navigation to leader as soon as the user starts moving the map
        if (!isProgrammaticMove.current) {
            setActiveGroupIndex({});
        }
    };

    const handleMoveEnd = (evt: any) => {
        if (evt.target) {
            // Immediately save simple state for localStorage
            const newState = evt.viewState;
            setViewState(newState);

            try {
                localStorage.setItem('geogram_map_view_state', JSON.stringify({
                    latitude: newState.latitude,
                    longitude: newState.longitude,
                    zoom: newState.zoom
                }));
            } catch (e) {
                // Ignore storage errors
            }

            // Throttle the heavy viewport bounds calculation (used for filtering/clustering)
            // This prevents massive React re-renders on every micro-movement
            throttledSetBounds(evt.target);
        }
    };

    const throttledSetBounds = useMemo(() => throttle((map: mapboxgl.Map) => {
        setViewportBounds(map.getBounds());
    }, 400, { leading: false, trailing: true }), []);

    // Initialize bounds once map is ready
    useEffect(() => {
        if (mapRef.current) {
            // Small timeout to ensure map is ready
            setTimeout(() => {
                const map = mapRef.current?.getMap();
                if (map) {
                    setViewportBounds(map.getBounds());
                }
            }, 500);
        }

        // Cleanup throttle on unmount
        return () => throttledSetBounds.cancel();
    }, [throttledSetBounds]);



    // Filter messages - show all valid messages at their exact locations
    // OPTIMIZED: Only process messages within the viewport (plus buffer)
    const visibleMessages = useMemo(() => {
        const now = Date.now();
        const expirationMs = expirationHours * 60 * 60 * 1000;

        // Safety check: Ensure messages is an array before filtering
        if (!Array.isArray(messages)) return [];

        // 1. Filter by expiration
        const activeMessages = messages.filter(msg => {
            const age = now - msg.timestamp;
            return age < expirationMs;
        });

        // 2. Filter by viewport if available
        if (viewportBounds) {
            // Add a buffer (e.g. 50% of viewport size) to prevent popping at edges
            const lngBuffer = (viewportBounds.getEast() - viewportBounds.getWest()) * 0.5;
            const latBuffer = (viewportBounds.getNorth() - viewportBounds.getSouth()) * 0.5;

            const west = viewportBounds.getWest() - lngBuffer;
            const east = viewportBounds.getEast() + lngBuffer;
            const south = viewportBounds.getSouth() - latBuffer;
            const north = viewportBounds.getNorth() + latBuffer;

            return activeMessages.filter(msg =>
                msg.lng >= west && msg.lng <= east &&
                msg.lat >= south && msg.lat <= north
            );
        }

        return activeMessages;
    }, [messages, expirationHours, viewportBounds]);

    // Filter messages based on the selected layer mode
    const filteredMessages = useMemo(() => {
        if (filterMode === 'friends-locations') return [];
        if (filterMode === 'friends-posts') {
            return visibleMessages.filter(msg => {
                // Check if user is a friend (or self)
                if (!currentUserData) return false;
                // 'friend' status means accepted friend
                return currentUserData.friends.some(f => f.id === msg.userId) || msg.userId === currentUserData.id;
            });
        }
        return visibleMessages;
    }, [visibleMessages, filterMode, currentUserData]);

    // Cluster posts into groups for carousel navigation
    const postGroups = useMemo(() => {
        const groups: { leaderId: string, posts: Message[], lat: number, lng: number }[] = [];
        const processed = new Set<string>();

        // Dynamic cluster radius
        const baseRadius = clusterRadius;
        const zoomFactor = Math.pow(2, 13 - viewState.zoom);
        const clusterRadiusLat = baseRadius * zoomFactor;
        const clusterRadiusLng = clusterRadiusLat / Math.cos(viewState.latitude * Math.PI / 180);

        // Fixed geographical threshold for carousel grouping (approx 1.5-2 meters)
        // This ensures only truly stacked posts remain in a carousel even at zoom 22.
        const STRICT_OVERLAP_THRESHOLD = 0.00002;

        // Helper to calculate score for Bubble eligibility
        const getScore = (msg: Message) => {
            let score = (msg.likes || 0);
            if (msg.visibility === 'friends') score += 50;
            const ageHours = (Date.now() - msg.timestamp) / (1000 * 60 * 60);
            if (ageHours < 1) score += 5;
            return score;
        };

        const sortedMessages = [...filteredMessages].sort((a, b) => {
            const scoreA = getScore(a);
            const scoreB = getScore(b);
            if (scoreA !== scoreB) return scoreB - scoreA;
            // Tie-Breaker 1: Recency
            if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
            // Tie-Breaker 2: Alphabetical ID (guaranteed stable)
            return b.id.localeCompare(a.id);
        });

        for (const msg of sortedMessages) {
            if (processed.has(msg.id)) continue;

            const group = {
                leaderId: msg.id,
                posts: [msg],
                lat: msg.lat,
                lng: msg.lng
            };
            processed.add(msg.id);

            // Collect nearby messages into this group
            for (const other of filteredMessages) {
                if (processed.has(other.id)) continue;

                const latDiff = Math.abs(other.lat - msg.lat);
                const lngDiff = Math.abs(other.lng - msg.lng);

                // If within cluster radius, they are hidden from bubble view
                if (latDiff < clusterRadiusLat && lngDiff < clusterRadiusLng) {
                    processed.add(other.id);

                    // BUT we only add them to the carousel if they are geographically overlapping
                    if (latDiff < STRICT_OVERLAP_THRESHOLD && lngDiff < STRICT_OVERLAP_THRESHOLD) {
                        group.posts.push(other);
                    }
                }
            }
            groups.push(group);
        }
        return groups;
    }, [filteredMessages, viewState.zoom, viewState.latitude, clusterRadius]);

    const postsToShowAsBubbles = useMemo(() => new Set(postGroups.map(g => g.leaderId)), [postGroups]);

    // O(1) Lookup Map for Magnet Logic
    const bubbleMap = useMemo(() => {
        const map = new Map<string, Message>();
        filteredMessages.forEach(msg => {
            if (postsToShowAsBubbles.has(msg.id)) {
                map.set(msg.id, msg);
            }
        });
        return map;
    }, [filteredMessages, postsToShowAsBubbles]);

    const bubblesToRender = useMemo(() => {
        const currentBubbleIds = new Set(postsToShowAsBubbles);

        // Calculate final list including both current and currently-exiting
        const active = filteredMessages
            .filter(msg => currentBubbleIds.has(msg.id))
            .map(msg => ({ msg, isExiting: false }));

        // Track which IDs are already in the active list to prevent duplicates
        const renderedIds = new Set(active.map(({ msg }) => msg.id));

        const exiting = Object.values(exitingBubbles)
            .filter(msg => !currentBubbleIds.has(msg.id) && !renderedIds.has(msg.id))
            .map(msg => ({ msg, isExiting: true }));

        return [...active, ...exiting];
    }, [filteredMessages, postsToShowAsBubbles, exitingBubbles]);

    // Detect exiting bubbles and maintain state (Safely in useEffect)
    useEffect(() => {
        const currentBubbleIds = postsToShowAsBubbles;
        const prevIds = previousBubblesSet.current;

        const newlyExiting: Record<string, Message> = {};
        let hasNewExiting = false;

        prevIds.forEach(id => {
            if (!currentBubbleIds.has(id) && !exitingBubbles[id]) {
                const msg = filteredMessages.find(m => m.id === id) ||
                    // Fallback if not found in filteredMessages (might have been removed from there too)
                    (messages as Message[]).find(m => m.id === id);

                if (msg) {
                    // SMART CHECK: Is this message being replaced by an identical one with a different ID?
                    // (e.g. optimistic temp-ID -> real DB ID)
                    const isBeingReplaced = Array.from(postsToShowAsBubbles).some(newId => {
                        const newMsg = (messages as Message[]).find(m => m.id === newId);
                        if (!newMsg) return false;

                        const nLat = newMsg.lat;
                        const nLng = newMsg.lng;
                        const mLat = msg.lat;
                        const mLng = msg.lng;

                        // Match by location (fixed to 6 decimals) - identical to bubbleLayoutId logic
                        return nLat?.toFixed(6) === mLat?.toFixed(6) &&
                            nLng?.toFixed(6) === mLng?.toFixed(6);
                    });

                    if (!isBeingReplaced) {
                        newlyExiting[id] = msg;
                        hasNewExiting = true;
                    }
                }
            }
        });

        if (hasNewExiting) {
            setExitingBubbles(prev => ({ ...prev, ...newlyExiting }));

            // Clean up after animation duration
            setTimeout(() => {
                setExitingBubbles(prev => {
                    const next = { ...prev };
                    Object.keys(newlyExiting).forEach(id => delete next[id]);
                    return next;
                });
            }, 600); // Matches animation duration
        }

        // Update ref for next comparison
        previousBubblesSet.current = new Set(currentBubbleIds);
    }, [postsToShowAsBubbles, filteredMessages, messages]);

    // Remove the old useEffect-based exiting logic

    // Remove obsolete spiderfy transition effects

    // Identify Dots (Messages that are NOT Bubbles)
    const visibleDots = useMemo(() => {
        return filteredMessages.filter(msg => !postsToShowAsBubbles.has(msg.id));
    }, [filteredMessages, postsToShowAsBubbles]);


    // Repellors derived from active Bubbles (Level 1 Priority)
    const bubbleRepellors = useMemo(() => {
        const zoomFactor = Math.pow(2, 13 - viewState.zoom);
        const radiusLat = 0.006 * zoomFactor;

        const reps: Repellor[] = [];
        bubbleMap.forEach(bubble => {
            const lat = bubble.lat;
            const rLat = radiusLat * 1.1; // 10% safety buffer for bubble "hard shell"
            reps.push({
                lat: bubble.lat,
                lng: bubble.lng,
                radiusLat: rLat,
                radiusLng: rLat / Math.cos(lat * Math.PI / 180),
                strength: 1.0,
                id: bubble.id
            });
        });
        return reps;
    }, [bubbleMap, viewState.zoom]);

    // Secondary Clustering: Cluster the Dots
    const dotClustersResult = useMemo(() => {
        const clusters: { id: string, lat: number, lng: number, originalLat: number, originalLng: number, count: number, ids: string[], messages: Message[] }[] = [];
        const processed = new Set<string>();

        const baseRadius = clusterRadius * 0.8;
        const zoomFactor = Math.pow(2, 13 - viewState.zoom);
        const clusterRadiusLat = baseRadius * zoomFactor;
        const clusterRadiusLng = baseRadius * zoomFactor / Math.cos(viewState.latitude * Math.PI / 180);

        const sortedDots = [...visibleDots].sort((a, b) => a.id.localeCompare(b.id));

        const clusterRepellors: Repellor[] = [];

        for (const msg of sortedDots) {
            if (processed.has(msg.id)) continue;

            const cluster = {
                id: msg.id,
                lat: msg.lat,
                lng: msg.lng,
                originalLat: msg.lat,
                originalLng: msg.lng,
                count: 1,
                ids: [msg.id],
                messages: [msg]
            };
            processed.add(msg.id);

            for (const other of sortedDots) {
                if (other.id === msg.id || processed.has(other.id)) continue;

                const latDiff = Math.abs(other.lat - msg.lat);
                const lngDiff = Math.abs(other.lng - msg.lng);

                if (latDiff < clusterRadiusLat && lngDiff < clusterRadiusLng) {
                    cluster.count++;
                    cluster.ids.push(other.id);
                    cluster.messages.push(other);
                    cluster.originalLat = (cluster.originalLat * (cluster.count - 1) + other.lat) / cluster.count;
                    cluster.originalLng = (cluster.originalLng * (cluster.count - 1) + other.lng) / cluster.count;
                    cluster.lat = cluster.originalLat;
                    cluster.lng = cluster.originalLng;
                    processed.add(other.id);
                }
            }

            if (cluster.count > 1) {
                // APPLY REPULSION TO CLUSTER (From Bubbles + previous Clusters)
                const finalPos = applyRepulsion(
                    cluster.lat,
                    cluster.lng,
                    cluster.originalLat,
                    cluster.originalLng,
                    [...bubbleRepellors, ...clusterRepellors],
                    viewState.zoom,
                    true // Lock to marker tip if exactly overlapping
                );
                cluster.lat = finalPos.lat;
                cluster.lng = finalPos.lng;

                // Add this cluster as a repellor for subsequent elements
                clusterRepellors.push({
                    lat: cluster.lat,
                    lng: cluster.lng,
                    radiusLat: clusterRadiusLat * 0.6, // Smaller collision zone for clusters
                    radiusLng: clusterRadiusLng * 0.6,
                    strength: 0.4, // Lower strength to prevent aggressive chain reactions
                    id: cluster.id
                });

                clusters.push(cluster);
            }
        }
        return { clusters, clusterRepellors };
    }, [visibleDots, viewState.zoom, viewState.latitude, clusterRadius, bubbleRepellors]);

    const activeDotClusters = useMemo(() => dotClustersResult.clusters, [dotClustersResult]);
    const clusterRepellors = useMemo(() => dotClustersResult.clusterRepellors, [dotClustersResult]);

    // Remaining Single Dots (Not in any dot cluster)
    const clusteredDotIds = useMemo(() => {
        const ids = new Set<string>();
        activeDotClusters.forEach(c => c.ids.forEach(id => ids.add(id)));
        return ids;
    }, [activeDotClusters]);

    // Prepare Dots GeoJSON for WebGL Layer vs React Markers
    const dotsProcessingResult = useMemo(() => {
        const unclusteredDots = visibleDots.filter(msg => !clusteredDotIds.has(msg.id));
        const stableFeatures: any[] = [];
        const displaced: any[] = [];

        unclusteredDots.forEach(msg => {
            // Pushed by Bubbles AND Clusters (Level 3 Priority)
            const finalPos = applyRepulsion(
                msg.lat,
                msg.lng,
                msg.lat,
                msg.lng,
                [...bubbleRepellors, ...clusterRepellors],
                viewState.zoom,
                true
            );

            const pixelDist = getPixelDistance(finalPos.lat, finalPos.lng, msg.lat, msg.lng, viewState.zoom);

            if (pixelDist > 2) {
                // DISPLACED: Render as React Marker with Notch
                displaced.push({
                    ...msg,
                    lat: finalPos.lat,
                    lng: finalPos.lng,
                    originalLat: msg.lat,
                    originalLng: msg.lng
                });
            } else {
                // STABLE: Render as WebGL Point (Performance)
                stableFeatures.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [finalPos.lng, finalPos.lat]
                    },
                    properties: {
                        ...msg,
                        id: msg.id,
                        visibility: msg.visibility,
                        isDot: true,
                        originalLat: msg.lat,
                        originalLng: msg.lng
                    }
                });
            }
        });

        return {
            dotsGeoJson: {
                type: 'FeatureCollection',
                features: stableFeatures
            },
            displacedDots: displaced
        };
    }, [visibleDots, clusteredDotIds, bubbleRepellors, clusterRepellors, viewState.zoom]);

    const dotsGeoJson = useMemo(() => dotsProcessingResult.dotsGeoJson, [dotsProcessingResult]);
    const displacedDots = useMemo(() => dotsProcessingResult.displacedDots, [dotsProcessingResult]);

    const dotLayerStyle: any = {
        id: 'dot-layer',
        type: 'circle',
        filter: ['==', ['get', 'isDot'], true],
        paint: {
            'circle-color': [
                'match',
                ['get', 'visibility'],
                'friends', '#10b981',
                '#a855f7'
            ],
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': selectedFriend ? 0.3 : 1,
            'circle-stroke-opacity': selectedFriend ? 0.3 : 1
        }
    };


    // Tertiary Clustering: Flocking System (Each person is unique, but targets cluster center)
    const flockPoints = useMemo(() => {
        const pointsMapping: Record<string, { lat: number, lng: number, clusterId: string, friendsInCluster: any[], stackIndex: number }> = {};
        const processed = new Set<string>();

        const baseRadius = clusterRadius * 1.5;
        const zoomFactor = Math.pow(2, 13 - viewState.zoom);
        const clusterRadiusLat = baseRadius * zoomFactor;
        const clusterRadiusLng = baseRadius * zoomFactor / Math.cos(viewState.latitude * Math.PI / 180);

        const allPeople = [];
        if (location) {
            allPeople.push({ id: 'self', lastLat: location.lat, lastLng: location.lng, name: session?.user?.name || 'You', image: session?.user?.image, isSelf: true });
        }
        if (currentUserData?.friends) {
            allPeople.push(...currentUserData.friends.filter(f => f.lastLat && f.lastLng));
        }

        for (const person of allPeople) {
            if (processed.has(person.id)) continue;

            const cluster = [person];
            processed.add(person.id);

            for (const other of allPeople) {
                if (other.id === person.id || processed.has(other.id)) continue;

                const latDiff = Math.abs(other.lastLat! - person.lastLat!);
                const lngDiff = Math.abs(other.lastLng! - person.lastLng!);

                if (latDiff < clusterRadiusLat && lngDiff < clusterRadiusLng) {
                    cluster.push(other);
                    processed.add(other.id);
                }
            }

            // If we are in a cluster, we prioritize 'self' as the leader for the visual stack
            if (cluster.some(p => p.id === 'self')) {
                const selfIdx = cluster.findIndex(p => p.id === 'self');
                const self = cluster.splice(selfIdx, 1)[0];
                cluster.unshift(self);
            }

            const flockLat = cluster.reduce((sum, p) => sum + p.lastLat!, 0) / cluster.length;
            const flockLng = cluster.reduce((sum, p) => sum + p.lastLng!, 0) / cluster.length;

            cluster.forEach((p, index) => {
                pointsMapping[p.id] = {
                    lat: cluster.length > 1 ? flockLat : p.lastLat!,
                    lng: cluster.length > 1 ? flockLng : p.lastLng!,
                    clusterId: person.id,
                    friendsInCluster: cluster,
                    stackIndex: cluster.length > 1 ? index : -1
                };
            });
        }
        return pointsMapping;
    }, [currentUserData?.friends, location, session?.user, viewState.zoom, viewState.latitude, clusterRadius]);

    // Convenient list for iterating
    const peopleToRender = useMemo(() => {
        const list = [];
        if (location) list.push({ id: 'self', isSelf: true, lastLat: location.lat, lastLng: location.lng, name: session?.user?.name, image: session?.user?.image });
        if (currentUserData?.friends) {
            list.push(...currentUserData.friends.filter(f => f.lastLat && f.lastLng).map(f => ({ ...f, isSelf: false })));
        }
        return list;
    }, [location, currentUserData?.friends, session?.user]);

    // Calculate which messages are near screen center for vote button visibility
    // FIXED: Use percentage-based thresholds relative to the actual viewport bounds
    // This ensures consistency across all zoom levels and screen sizes
    const markersNearCenter = useMemo(() => {
        if (!viewportBounds) return new Set<string>();

        const centerLat = viewState.latitude;
        const centerLng = viewState.longitude;

        // Calculate actual viewport height and width in degrees
        const viewportLatSpan = Math.abs(viewportBounds.getNorth() - viewportBounds.getSouth());
        const viewportLngSpan = Math.abs(viewportBounds.getEast() - viewportBounds.getWest());

        // Focus area: Uses centralized percentage config
        const latThreshold = viewportLatSpan * (FOCUS_CONFIG.verticalBand / 2);
        const lngThreshold = viewportLngSpan * (FOCUS_CONFIG.horizontalBand / 2);

        return new Set(
            filteredMessages
                .filter(msg => {
                    const latDiff = Math.abs(msg.lat - centerLat);
                    const lngDiff = Math.abs(msg.lng - centerLng);
                    return latDiff < latThreshold && lngDiff < lngThreshold;
                })
                .map(msg => msg.id)
        );
    }, [filteredMessages, viewState.latitude, viewState.longitude, viewportBounds]);

    // Handle voting
    const handleVote = async (id: string, action: 'like' | 'dislike', unlimited: boolean) => {
        await voteMessage(id, action, currentUserData?.id, unlimited);
    };

    // Fly to marker location on click and select message
    const handleMarkerClick = (msg: Message, fromDot: boolean = false) => {
        setSelectedMessage(msg);
        setLocationName(null);

        if (!fromDot) {
            setMessageDetailsOpen(true);
        } else {
            setMessageDetailsOpen(false);
        }

        if (mapRef.current) {
            const targetZoom = viewState.zoom > 16 ? viewState.zoom : 16;
            isProgrammaticMove.current = true;
            mapRef.current.flyTo({
                center: [msg.lng, msg.lat],
                zoom: targetZoom,
                padding: { top: fromDot ? 100 : 450, bottom: 0, left: 0, right: 0 },
                speed: 1.5,
                curve: 1.42,
                essential: true
            });
            setTimeout(() => {
                isProgrammaticMove.current = false;
            }, 800);
        }
    };

    // CRITICAL FIX: Reset map padding when message details are closed
    // Without this, the map keeps the huge top-padding, making bubbles disappear at the top of the screen
    useEffect(() => {
        if (!selectedMessage && mapRef.current) {
            mapRef.current.easeTo({
                padding: { top: 0, bottom: 0, left: 0, right: 0 },
                duration: 400
            });
        }
    }, [selectedMessage]);

    // Fetch location name when a message is selected
    useEffect(() => {
        if (selectedMessage && MAPBOX_TOKEN) {
            const fetchLocationName = async () => {
                try {
                    const response = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${selectedMessage.lng},${selectedMessage.lat}.json?access_token=${MAPBOX_TOKEN}&types=poi,address`
                    );
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                        setLocationName(data.features[0].place_name);
                    } else {
                        setLocationName(`${selectedMessage.lat.toFixed(4)}, ${selectedMessage.lng.toFixed(4)}`);
                    }
                } catch (error) {
                    console.error("Error fetching location name:", error);
                    setLocationName(`${selectedMessage.lat.toFixed(4)}, ${selectedMessage.lng.toFixed(4)}`);
                }
            };
            fetchLocationName();
        }
    }, [selectedMessage]);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false); // New state for toggle
    const searchRef = useRef<HTMLDivElement>(null);
    const layersRef = useRef<HTMLDivElement>(null);

    // Handle Click Outside Search & Layers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;

            // Close Search if click is outside
            if (isSearchOpen && searchRef.current && !searchRef.current.contains(target)) {
                setIsSearchOpen(false);
            }

            // Close Layers if click is outside
            if (isLayersOpen && layersRef.current && !layersRef.current.contains(target)) {
                setIsLayersOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isSearchOpen, isLayersOpen]);

    // Handle Search
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
            const params = new URLSearchParams({
                access_token: MAPBOX_TOKEN || '',
                types: 'place,country,poi,address',
                limit: '5',
                language: 'en' // or make this dynamic
            });

            const response = await fetch(`${endpoint}?${params}`);
            const data = await response.json();

            if (data.features) {
                setSearchResults(data.features);
                setShowResults(true);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectLocation = (feature: any) => {
        const [lng, lat] = feature.center;

        mapRef.current?.flyTo({
            center: [lng, lat],
            zoom: feature.bbox ? 12 : 14, // Zoom level depends on result type usually, but generic is fine
            duration: 2000,
            essential: true
        });

        // If bbox exists and matches viewport roughly, fitBounds might be better, 
        // but flyTo center is simpler for now and cleaner.

        setShowResults(false);
        setSearchQuery(""); // Allow auto-clear
        setIsSearchOpen(false); // Auto-close
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchResults([]);
        setShowResults(false);
    };

    // Force Static Lighting to prevent "Black Hemisphere"
    // We set a high ambient light so everything is visible
    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (map && map.setLights) {
            map.setLights([
                {
                    id: 'ambient_light',
                    type: 'ambient',
                    properties: {
                        color: '#ffffff',
                        intensity: 1.0 // Fully lit, no shadows
                    }
                }
            ]);
        }
    }, []);

    // Sync with user location once found (ONLY if not already centered/restored)
    useEffect(() => {
        if (location && !hasCentered.current) {
            setViewState((prev) => ({
                ...prev,
                latitude: location.lat,
                longitude: location.lng,
                zoom: 15,
            }));
            hasCentered.current = true;
        }
    }, [location]);

    if (!MAPBOX_TOKEN) {
        return <div className="p-4 text-white">Mapbox Token Missing</div>;
    }

    return (
        <div
            className="w-full h-screen"
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                cursor: isSimulationMode ? 'crosshair' : 'default'
            }}
        >
            {/* Map Layers Filter - Left Side */}
            {/* Map Layers Filter - Left Side */}
            <div ref={layersRef}>
                <MapLayers
                    currentFilter={filterMode}
                    onFilterChange={setFilterMode}
                    isOpen={isLayersOpen}
                    onToggle={() => setIsLayersOpen(!isLayersOpen)}
                />
            </div>

            {/* Search Bar Overlay - Top Right */}
            <div
                ref={searchRef}
                className={`fixed top-[calc(1rem+env(safe-area-inset-top))] right-4 z-50 transition-[width,height,opacity] duration-300 ease-in-out ${isSearchOpen ? 'w-[calc(100vw-32px)] sm:w-[320px]' : 'w-12 h-12'
                    }`}
            >
                <div className="relative group flex justify-end">
                    {/* Collapsed State (Button) */}
                    {!isSearchOpen && (
                        <button
                            onClick={() => {
                                setIsSearchOpen(true);
                                // input will auto-focus via autoFocus prop or ref if rendered
                            }}
                            className="bg-gradient-to-br from-purple-600 to-indigo-600 border border-white/20 rounded-full w-12 h-12 flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg shadow-purple-600/40"
                        >
                            <Search className="h-6 w-6" />
                        </button>
                    )}

                    {/* Expanded State (Input) */}
                    {/* Expanded State (Input) */}
                    <AnimatePresence>
                        {isSearchOpen && (
                            <m.div
                                initial={{ opacity: 0, scale: 0.9, width: 0 }}
                                animate={{ opacity: 1, scale: 1, width: "100%" }}
                                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="relative w-full"
                            >
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        // Mobile "Go" or Desktop "Enter"
                                        if (searchResults.length > 0) {
                                            handleSelectLocation(searchResults[0]);
                                        } else if (searchQuery.length > 2) {
                                            // Fallback: Perform search if no results yet (fast typer)
                                            try {
                                                const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
                                                const params = new URLSearchParams({
                                                    access_token: MAPBOX_TOKEN || '',
                                                    types: 'place,country,poi,address',
                                                    limit: '1',
                                                    language: 'en'
                                                });
                                                const response = await fetch(`${endpoint}?${params}`);
                                                const data = await response.json();
                                                if (data.features && data.features.length > 0) {
                                                    handleSelectLocation(data.features[0]);
                                                }
                                            } catch (err) {
                                                console.error("Fast search failed", err);
                                            }
                                        }
                                    }}
                                    className="relative w-full"
                                >
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-purple-300" />
                                    </div>
                                    <input
                                        autoFocus
                                        type="text" // 'search' type might show 'x' on some browsers, keeping text for custom style
                                        enterKeyHint="search"
                                        className="block w-full pl-9 pr-9 py-3 bg-[#1a0033]/90 backdrop-blur-xl border border-purple-500/50 rounded-full text-base text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-2xl shadow-purple-900/50"
                                        placeholder={t('search') + "..."}
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                    // onKeyDown handled by form onSubmit
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearSearch();
                                            setIsSearchOpen(false);
                                        }}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-white transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </form>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Search Results Dropdown - Only show if search is OPEN */}
                {isSearchOpen && showResults && searchResults.length > 0 && (
                    <div className="absolute mt-2 w-full bg-[#1a0033]/90 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <ul>
                            {searchResults.map((result) => (
                                <li
                                    key={result.id}
                                    onClick={() => handleSelectLocation(result)}
                                    className="px-4 py-3 hover:bg-purple-900/50 cursor-pointer text-white border-b border-purple-500/10 last:border-none transition-colors"
                                >
                                    <div className="font-medium text-sm text-purple-100">{result.text}</div>
                                    <div className="text-xs text-purple-400 truncate">{result.place_name}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <MapGL
                ref={mapRef}
                {...viewState}
                // light prop removed to fix deprecation warning
                onMove={(evt) => {
                    const previousZoom = viewState.zoom;
                    setViewState(evt.viewState);
                    console.log("🔍 Current Zoom:", evt.viewState.zoom.toFixed(2));

                    // Update viewport bounds in real-time for clustering/magnet logic
                    if (evt.target) {
                        setViewportBounds(evt.target.getBounds());
                    }

                    // Close details on any zoom change (slow or fast) - ONLY IF USER INITIATED
                    // We check evt.originalEvent and specifically allow only direct interactions
                    const originalEvent = (evt as any).originalEvent;
                    const isUserInteraction = originalEvent &&
                        ['mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchend', 'touchmove', 'wheel', 'keydown'].includes(originalEvent.type);

                    if (isUserInteraction && !isProgrammaticMove.current && selectedMessage && Math.abs(evt.viewState.zoom - previousZoom) > 0.01) {
                        setSelectedMessage(null);
                        setMessageDetailsOpen(false);
                    }

                    // Close search on map move
                    if (isUserInteraction && !isProgrammaticMove.current && isSearchOpen) {
                        setIsSearchOpen(false);
                        // Optional: Clear search if desired, but just closing is less destructive
                        // clearSearch(); 
                    }

                    // Close layers on map move
                    if (isUserInteraction && !isProgrammaticMove.current && isLayersOpen) {
                        setIsLayersOpen(false);
                    }

                    // Close friend popup only on user-initiated movement, not programmatic flyTo
                    if (isUserInteraction && !isProgrammaticMove.current && selectedFriend) {
                        setSelectedFriend(null);
                    }
                }}
                onMoveStart={(evt) => {
                    // Only close on user interaction (drag start), not resize or flyTo
                    const originalEvent = (evt as any).originalEvent;
                    const isUserInteraction = originalEvent &&
                        ['mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchend', 'touchmove', 'wheel', 'keydown'].includes(originalEvent.type);

                    if (isUserInteraction && !isProgrammaticMove.current) {
                        // Reset carousel navigation
                        setActiveGroupIndex({});

                        // Close friend popup
                        if (selectedFriend) {
                            setSelectedFriend(null);
                        }
                    }

                    if (isUserInteraction && !isProgrammaticMove.current && selectedMessage) {
                        setSelectedMessage(null);
                        setMessageDetailsOpen(false);
                    }

                    if (isUserInteraction && !isProgrammaticMove.current && isSearchOpen) {
                        setIsSearchOpen(false); // Also closes results via conditional rendering
                        // setShowResults(false); // Redundant if parent checks isSearchOpen
                    }

                    if (isUserInteraction && !isProgrammaticMove.current && isLayersOpen) {
                        setIsLayersOpen(false);
                    }
                }}
                onMoveEnd={handleMoveEnd}
                style={{
                    width: "100%",
                    height: "100%",
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
                mapStyle={customMapStyle as any}
                mapboxAccessToken={MAPBOX_TOKEN}
                attributionControl={false}
                projection="globe"
                logoPosition="bottom-left"
                fog={FOG_CONFIG as any}
                // --- PHASE 2 & 3 ANDROID WEBVIEW OPTIMIZATIONS ---
                // Disable cross-source collisions to save CPU cycles during pans
                crossSourceCollisions={false}
                fadeDuration={0} // Disable label/icon fade-in for snappy render
                preserveDrawingBuffer={false} // Phase 3: Prevent WebGL from holding frame buffers
                // ---------------------------------------------


                onLoad={() => {

                    console.log("🗺️ Map Loaded");
                    setIsMapLoaded(true);
                }}
                onClick={async (evt) => {
                    if (isSimulationMode) {
                        const { lng, lat } = evt.lngLat;
                        const randomMessages = [
                            "Wow, what a view!",
                            "Anyone else here?",
                            "Exploring the city!",
                            "Found a cool spot!",
                            "Hidden gem right here.",
                            "Traffic is crazy...",
                            "Beautiful sunset.",
                            "Best coffee in town!",
                            "Love this neighborhood.",
                            "Walking the dog."
                        ];
                        const randomText = randomMessages[Math.floor(Math.random() * randomMessages.length)];

                        // Optimistic update or direct call? using hook logic
                        // We need access to sendMessage from useMessages.
                        // It is already imported.

                        await fetch("/api/messages", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ text: randomText, lat, lng }),
                        });

                        // We rely on SWR revalidation or we can trigger it
                        // Since useMessages is in parent scope, we might need to trigger re-fetch
                        // But for now let's just let the poll interval catch it or if we can access mutate
                    } else {
                        setSelectedMessage(null);
                        setMessageDetailsOpen(false);
                        setIsLayersOpen(false); // Close layers on map click
                    }
                }}
            >
                {/* Unified Location Rendering (User + Friends + Clusters) */}
                {/* Unified Flocking Rendering (User + Friends + Clusters) */}
                {(filterMode === 'all' || filterMode === 'friends-locations') && peopleToRender.map((person) => {
                    const flockInfo = flockPoints[person.id];
                    if (!flockInfo) return null;

                    const isHighZoom = viewState.zoom >= THRESHOLD_ZOOM_DECLUSTER;

                    // Dynamic Radius: Beyond threshold, markers push further away as you zoom closer
                    const dynamicRadius = isHighZoom
                        ? ORBITAL_RADIUS + (viewState.zoom - THRESHOLD_ZOOM_DECLUSTER) * 25
                        : ORBITAL_RADIUS;

                    return (
                        <AnimatedMarker
                            key={`person-${person.id}`}
                            longitude={flockInfo.lng}
                            latitude={flockInfo.lat}
                            anchor={flockInfo.stackIndex !== -1 ? "center" : "bottom"}
                            zIndex={flockInfo.stackIndex !== -1 ? 1000 - flockInfo.stackIndex : 800}
                        >
                            {flockInfo.stackIndex !== -1 ? (
                                isHighZoom ? (
                                    // High zoom: Show individual markers with expanded orbital offset
                                    <div style={{
                                        transform: (() => {
                                            const isLeader = flockInfo.stackIndex === 0;
                                            if (isLeader) return 'scale(1.0)';
                                            const followerIndex = flockInfo.stackIndex - 1;
                                            const totalFollowers = Math.max(flockInfo.friendsInCluster.length - 1, 1);
                                            const angle = (followerIndex * (360 / totalFollowers) - 90) * (Math.PI / 180);
                                            const tx = Math.cos(angle) * dynamicRadius;
                                            const ty = Math.sin(angle) * dynamicRadius;
                                            return `translate(${tx}px, ${ty}px) scale(0.85)`;
                                        })(),
                                        zIndex: flockInfo.stackIndex === 0 ? 100 : 10 - flockInfo.stackIndex
                                    }}>
                                        <FriendMarker
                                            friend={person}
                                            showAura={isSelf(person)}
                                            onClick={() => {
                                                if (person.lastLat && person.lastLng) {
                                                    setSelectedFriend(person);

                                                    // Center with offset even at high zoom
                                                    const currentZoom = viewState.zoom;
                                                    const latOffset = 0.0035 * Math.pow(2, 13 - currentZoom);

                                                    isProgrammaticMove.current = true;
                                                    mapRef.current?.flyTo({
                                                        center: [person.lastLng, person.lastLat + latOffset],
                                                        zoom: currentZoom,
                                                        speed: 1.5,
                                                        curve: 1.42
                                                    });
                                                    setTimeout(() => {
                                                        isProgrammaticMove.current = false;
                                                    }, 800);
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    // Normal zoom: Show simple avatar clusters
                                    <FriendClusterMarker
                                        count={flockInfo.friendsInCluster.length}
                                        friends={[person]}
                                        stackIndex={flockInfo.stackIndex}
                                        onClick={() => {
                                            if (mapRef.current) {
                                                isProgrammaticMove.current = true;
                                                mapRef.current.flyTo({
                                                    center: [flockInfo.lng, flockInfo.lat],
                                                    zoom: Math.max(viewState.zoom + 2, THRESHOLD_ZOOM_DECLUSTER),
                                                    speed: 1.5,
                                                    curve: 1.42
                                                });
                                                setTimeout(() => {
                                                    isProgrammaticMove.current = false;
                                                }, 1000);
                                            }
                                        }}
                                    />
                                )
                            ) : (
                                <FriendMarker
                                    friend={person}
                                    showAura={isSelf(person)}
                                    onClick={() => {
                                        if (person.lastLat && person.lastLng) {
                                            setSelectedFriend(person);
                                            isProgrammaticMove.current = true;

                                            // Dynamic latitude offset based on zoom for perfect centering
                                            const zoom = 15;
                                            const latOffset = 0.0035 * Math.pow(2, 13 - zoom);

                                            mapRef.current?.flyTo({
                                                center: [person.lastLng, person.lastLat + latOffset],
                                                zoom: zoom,
                                                speed: 1.5,
                                                curve: 1.42
                                            });
                                            setTimeout(() => {
                                                isProgrammaticMove.current = false;
                                            }, 1000);
                                        }
                                    }}
                                />
                            )}
                        </AnimatedMarker>
                    );
                })}

                {/* Friend Popup */}
                <AnimatePresence>
                    {selectedFriend && selectedFriend.lastLat && selectedFriend.lastLng && (
                        <Marker
                            latitude={selectedFriend.lastLat}
                            longitude={selectedFriend.lastLng}
                            anchor="bottom"
                            style={{ zIndex: 10000 }} // Ensure it's always on top of other markers
                        >
                            <m.div
                                initial={{
                                    scale: 0.9,
                                    opacity: 0,
                                    y: -10,
                                    backdropFilter: 'blur(0px) saturate(100%)'
                                }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    y: -20, // Float above the marker
                                    backdropFilter: 'blur(6px) saturate(100%) hue-rotate(250deg)'
                                }}
                                exit={{
                                    scale: 0.9,
                                    opacity: 0,
                                    y: -10,
                                    backdropFilter: 'blur(0px) saturate(100%)'
                                }}
                                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                className="pointer-events-auto p-3.5 min-w-[200px] relative group/popup rounded-2xl border-2 border-emerald-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.2)] bg-emerald-950/45"
                                style={{ transformStyle: 'preserve-3d' }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full border-2 border-emerald-300 shadow-xl overflow-hidden bg-black ring-2 ring-emerald-500/20">
                                                {selectedFriend.image ? (
                                                    <img src={selectedFriend.image} alt={selectedFriend.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-emerald-600 flex items-center justify-center border-2 border-black/10 font-bold text-xl text-white">
                                                        {selectedFriend.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-emerald-950 ${selectedFriend.lastSeen && (Date.now() - new Date(selectedFriend.lastSeen).getTime() < 5 * 60 * 1000)
                                                ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]'
                                                : 'bg-gray-500'
                                                }`}></div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold text-base tracking-tight leading-tight">{selectedFriend.name}</h3>
                                            <p className="text-emerald-400/90 font-medium text-xs">@{selectedFriend.username || selectedFriend.name.toLowerCase().replace(/\s/g, '')}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedFriend(null); }}
                                            className="absolute -top-1.5 -right-1.5 w-7 h-7 flex items-center justify-center bg-emerald-500/15 hover:bg-emerald-500/40 backdrop-blur-md border border-emerald-400/20 rounded-full transition-all text-emerald-100 hover:scale-110 shadow-md"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    </div>

                                    {selectedFriend.lastSeen && (
                                        <div className="flex items-center gap-2 text-[10px] text-emerald-50 bg-emerald-400/10 rounded-lg px-3 py-2 border border-emerald-400/15 relative z-10">
                                            <Clock size={12} className="text-emerald-300" />
                                            <span className="font-semibold">
                                                {Date.now() - new Date(selectedFriend.lastSeen).getTime() < 5 * 60 * 1000
                                                    ? 'Online Now'
                                                    : `Seen ${formatRelativeTime(new Date(selectedFriend.lastSeen).getTime())} ago`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Glass reflection effect */}
                                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-40 z-10">
                                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 via-transparent to-transparent rotate-45" />
                                </div>
                            </m.div>
                        </Marker>
                    )}
                </AnimatePresence>

                {/* 3a. STABLE DOTS: Single lowlight posts (WebGL Optimized) */}
                <Source id="dots-source" type="geojson" data={dotsGeoJson as any}>
                    <Layer
                        {...dotLayerStyle}
                        onClick={(e: any) => {
                            const features = e.features;
                            if (features && features.length > 0) {
                                const msg = features[0].properties as any;
                                handleMarkerClick(msg, true);
                            }
                        }}
                    />
                </Source>

                {/* 3b. DISPLACED DOTS: Active Markers with SVG Notches */}
                <AnimatePresence mode="popLayout">
                    {displacedDots.map((dot) => (
                        <AnimatedMarker
                            key={`displaced-dot-${dot.id}`}
                            latitude={dot.lat}
                            longitude={dot.lng}
                            anchor="center"
                            zIndex={15}
                        >
                            <div className="relative">
                                {/* Displacement Notch (Points back to original location) */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: `translate(-50%, -50%) rotate(${getNotchAngle(dot.lat, dot.lng, dot.originalLat, dot.originalLng)}deg)`,
                                        width: '40px',
                                        height: '40px',
                                        pointerEvents: 'none',
                                        zIndex: -1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="40" height="40" viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
                                        {/* Dashed line to source */}
                                        <line
                                            x1="20" y1="20"
                                            x2="40" y2="20"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeDasharray="3,2"
                                            opacity="0.5"
                                        />
                                        {/* Arrow head at source end */}
                                        <path
                                            d="M 40 20 L 36 18 M 40 20 L 36 22"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            opacity="0.7"
                                        />
                                    </svg>
                                </div>

                                {/* The Dot itself */}
                                <div
                                    onClick={() => handleMarkerClick(dot, true)}
                                    className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] cursor-pointer hover:scale-150 transition-all"
                                    style={{
                                        background: dot.visibility === 'friends'
                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                            : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)'
                                    }}
                                />
                            </div>
                        </AnimatedMarker>
                    ))}
                </AnimatePresence>

                {/* 2. CLUSTERS: Groups of dots (lowlights) */}
                <AnimatePresence mode="popLayout">
                    {activeDotClusters.map((cluster) => (
                        // Cluster rendering (simplified, no spiderfy)
                        <AnimatedMarker
                            key={`cluster-${cluster.id}`}
                            latitude={cluster.lat}
                            longitude={cluster.lng}
                            anchor="center"
                            zIndex={20}
                        >
                            <div className="relative">
                                {/* Displacement Notch (Points back to original location) */}
                                {getPixelDistance(cluster.lat, cluster.lng, cluster.originalLat, cluster.originalLng, viewState.zoom) > 2 && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: `translate(-50%, -50%) rotate(${getNotchAngle(cluster.lat, cluster.lng, cluster.originalLat, cluster.originalLng)}deg)`,
                                            width: '40px',
                                            height: '40px',
                                            pointerEvents: 'none',
                                            zIndex: -1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <svg width="40" height="40" viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
                                            {/* Dashed line to source */}
                                            <line
                                                x1="20" y1="20"
                                                x2="40" y2="20"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeDasharray="3,2"
                                                opacity="0.5"
                                            />
                                            {/* Arrow head at source end */}
                                            <path
                                                d="M 40 20 L 35 17 M 40 20 L 35 23"
                                                stroke="white"
                                                strokeWidth="2"
                                                opacity="0.7"
                                            />
                                        </svg>
                                    </div>
                                )}

                                <div
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-[1.5px] border-white/80 shadow-[0_0_15px_rgba(124,58,237,0.5)] text-white font-bold text-sm cursor-pointer hover:scale-110 transition-transform"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const children = cluster.messages || [];
                                        if (children.length === 0) return;

                                        if (mapRef.current) {
                                            isProgrammaticMove.current = true;

                                            // 1. Calculate spread (RMS Distance from weighted center)
                                            let sumSqDistLat = 0;
                                            let sumSqDistLng = 0;

                                            children.forEach(dot => {
                                                const dLat = dot.lat - cluster.originalLat;
                                                const dLng = dot.lng - cluster.originalLng;
                                                sumSqDistLat += dLat * dLat;
                                                sumSqDistLng += dLng * dLng;
                                            });

                                            const rmsLat = Math.sqrt(sumSqDistLat / children.length);
                                            const rmsLng = Math.sqrt(sumSqDistLng / children.length);

                                            // 2. Define "Core Population" bounds (WeightedCenter ± 1.5 * Spread)
                                            // Add tiny epsilon to avoid zero-size bounds
                                            const spreadFactor = 1.5;
                                            const marginLat = Math.max(rmsLat * spreadFactor, 0.0001);
                                            const marginLng = Math.max(rmsLng * spreadFactor, 0.0001);

                                            const coreBounds: [[number, number], [number, number]] = [
                                                [cluster.originalLng - marginLng, cluster.originalLat - marginLat],
                                                [cluster.originalLng + marginLng, cluster.originalLat + marginLat]
                                            ];

                                            // 3. Find camera settings to fit the core population
                                            const camera = mapRef.current.cameraForBounds(coreBounds, { padding: 60 });

                                            // 4. Stepped Zoom Delta: Limit how much we jump in one click (Max +3.0)
                                            // This prevents "teleporting" from zoom 2 directly into a deep city view
                                            const MAX_ZOOM_JUMP = 3.0;
                                            const targetZoom = camera?.zoom || (viewState.zoom + 2);
                                            const cappedZoom = Math.min(targetZoom, viewState.zoom + MAX_ZOOM_JUMP);

                                            // 5. Fly specifically to the weighted center
                                            mapRef.current.flyTo({
                                                center: [cluster.originalLng, cluster.originalLat],
                                                zoom: Math.min(cappedZoom, 18),
                                                speed: 1.5,
                                                curve: 1.42,
                                                essential: true
                                            });

                                            setTimeout(() => { isProgrammaticMove.current = false; }, 1200);
                                        }
                                    }}
                                >
                                    +{cluster.count}
                                </div>
                            </div>
                        </AnimatedMarker>
                    ))}
                </AnimatePresence>

                {/* 1. BUBBLES: Posts to show as full bubbles (RENDER LAST) */}
                <AnimatePresence mode="popLayout">
                    {bubblesToRender.map(({ msg, isExiting }) => {
                        const isPremium = msg.userIsPremium;
                        const isFriends = msg.visibility === 'friends';
                        const zIndex = (isFriends ? 1000 : isPremium ? 500 : 100) + (msg.likes || 0);

                        // Find the group for this bubble
                        const group = postGroups.find(g => g.leaderId === msg.id);
                        const groupPosts = group?.posts || [msg];
                        const currentIndex = activeGroupIndex[msg.id] || 0;
                        const displayMsg = groupPosts[currentIndex % groupPosts.length];

                        const bubbleLayoutId = `bubble-${msg.lat?.toFixed(6)}-${msg.lng?.toFixed(6)}`;

                        const handlePrev = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setActiveGroupIndex(prev => ({
                                ...prev,
                                [msg.id]: (currentIndex - 1 + groupPosts.length) % groupPosts.length
                            }));
                        };

                        const handleNext = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setActiveGroupIndex(prev => ({
                                ...prev,
                                [msg.id]: (currentIndex + 1) % groupPosts.length
                            }));
                        };

                        return (
                            <AnimatedMarker
                                key={msg.id}
                                latitude={msg.lat}
                                longitude={msg.lng}
                                anchor="bottom"
                                zIndex={zIndex}
                                layoutId={bubbleLayoutId}
                            >
                                {!(selectedMessage?.id === msg.id && isMessageDetailsOpen) && (
                                    <div className="relative group/bubble flex items-center justify-center">
                                        {/* Carousel Arrows */}
                                        {groupPosts.length > 1 && !isExiting && (
                                            <>
                                                <button
                                                    onClick={handlePrev}
                                                    className={`absolute -left-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all hover:bg-white/40 active:scale-95 shadow-lg z-50 ${viewState.zoom > 16 ? 'opacity-100' : 'opacity-0 group-hover/bubble:opacity-100'}`}
                                                >
                                                    <ChevronLeft size={18} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={handleNext}
                                                    className={`absolute -right-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white transition-all hover:bg-white/40 active:scale-95 shadow-lg z-50 ${viewState.zoom > 16 ? 'opacity-100' : 'opacity-0 group-hover/bubble:opacity-100'}`}
                                                >
                                                    <ChevronRight size={18} strokeWidth={2.5} />
                                                </button>

                                                {/* Page indicator */}
                                                <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 transition-opacity whitespace-nowrap px-2 py-0.5 rounded-full bg-purple-600/90 backdrop-blur-md text-[10px] text-white font-bold border border-white/20 shadow-lg pointer-events-none lowercase ${viewState.zoom > 16 ? 'opacity-100' : 'opacity-0 group-hover/bubble:opacity-100'}`}>
                                                    {currentIndex + 1} / {groupPosts.length}
                                                </div>
                                            </>
                                        )}

                                        <div className={`transition-all duration-300 ${selectedFriend ? 'blur-sm opacity-50' : ''}`}>
                                            <MessageMarker
                                                message={displayMsg}
                                                onVote={handleVote}
                                                onClick={() => handleMarkerClick(displayMsg)}
                                                currentUser={currentUserData}
                                                unlimitedVotes={unlimitedVotes}
                                                isSelected={selectedMessage?.id === displayMsg.id}
                                                isNearCenter={true}
                                                showActions={!isExiting && markersNearCenter.has(msg.id)}
                                                zoom={viewState.zoom}
                                                isExiting={isExiting}
                                            />
                                        </div>
                                    </div>
                                )}
                            </AnimatedMarker>
                        );
                    })}
                </AnimatePresence>

                {/* Message Details Overlay - Expanded from Bubble AS A MARKER */}
                {selectedMessage && isMessageDetailsOpen && (
                    <Marker
                        latitude={selectedMessage.lat}
                        longitude={selectedMessage.lng}
                        anchor="bottom"
                        style={{ zIndex: 100 }} // Ensure it's on top
                    >
                        <MessageDetails
                            message={selectedMessage}
                            layoutId={`message-container-${selectedMessage.id}`}
                            onClose={() => {
                                setSelectedMessage(null);
                                setMessageDetailsOpen(false);
                            }}
                            onVote={handleVote}
                            onAddFriend={onAddFriend}
                            getFriendStatus={getFriendStatus}
                            currentUser={session}
                            unlimitedVotes={unlimitedVotes}
                            locationName={locationName}
                            onDelete={async (id) => {
                                const result = await deleteMessage(id);
                                if (result?.success) {
                                    setSelectedMessage(null);
                                    setMessageDetailsOpen(false);
                                }
                                return result || { success: false };
                            }}
                        />
                    </Marker>
                )}
            </MapGL>

            {/* DEBUG FOCUS AREA VISUALIZER - Commented out for production */}
            {/* 
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5] overflow-hidden">
                <div 
                    className="border-2 border-white/10 bg-white/5 rounded-2xl backdrop-blur-[1px] shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    style={{
                        width: `${FOCUS_CONFIG.horizontalBand * 100}%`,
                        height: `${FOCUS_CONFIG.verticalBand * 100}%`,
                        transition: 'all 0.3s ease'
                    }}
                >
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/40 rounded-full border border-white/10">
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Focus Zone</span>
                    </div>
                </div>
            </div>
            */}


            {
                locationError && (
                    <div className="absolute top-[calc(1rem+env(safe-area-inset-top))] left-4 bg-red-500 text-white px-3 py-1 rounded shadow-md z-10 text-xs">
                        Location Error: {locationError.message}
                    </div>
                )
            }
        </div>
    );
}
