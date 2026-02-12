"use client";

import Map, { Marker, NavigationControl, GeolocateControl, MapRef } from "react-map-gl/mapbox";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/hooks/useLocation";
import { useMessages } from "@/hooks/useMessages";
import { customMapStyle } from "@/lib/mapboxStyle";
import { useConfig } from "@/context/ConfigContext";
import { Message } from "@/lib/store";
import { useSession } from "next-auth/react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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

// Custom Blue Dot Icon for User Location (SVG)
const UserLocationMarker = () => (
    <div className="relative flex items-center justify-center w-6 h-6">
        <div className="absolute w-full h-full bg-cyan-400 opacity-30 rounded-full animate-ping"></div>
        <div className="relative w-3 h-3 bg-cyan-400 border-2 border-white rounded-full shadow-sm"></div>
    </div>
);

// Vote Controls Component - Shared between Bubble and Details Panel
// Vote Controls Component - Shared between Bubble and Details Panel
const VoteControls = ({
    message,
    onVote,
    currentUser,
    unlimitedVotes = false,
    orientation = 'corner'
}: {
    message: Message;
    onVote?: (id: string, action: 'like' | 'dislike', unlimited: boolean) => void;
    currentUser?: any;
    unlimitedVotes?: boolean;
    orientation?: 'corner' | 'horizontal';
}) => {
    const [optimisticLikes, setOptimisticLikes] = useState(message.likes || 0);
    const [optimisticDislikes, setOptimisticDislikes] = useState(message.dislikes || 0);

    // Track optimistic "active" state
    const userId = currentUser?.email || currentUser?.name || "anonymous";
    const initialHasLiked = (message.likedBy || []).includes(userId);
    const initialHasDisliked = (message.dislikedBy || []).includes(userId);

    const [optimisticHasLiked, setOptimisticHasLiked] = useState(initialHasLiked);
    const [optimisticHasDisliked, setOptimisticHasDisliked] = useState(initialHasDisliked);

    const [likeAnimation, setLikeAnimation] = useState(false);
    const [dislikeAnimation, setDislikeAnimation] = useState(false);

    useEffect(() => {
        setOptimisticLikes(message.likes || 0);
        setOptimisticDislikes(message.dislikes || 0);
        setOptimisticHasLiked((message.likedBy || []).includes(userId));
        setOptimisticHasDisliked((message.dislikedBy || []).includes(userId));
    }, [message.likes, message.dislikes, message.id, message.likedBy, message.dislikedBy, userId]);

    const handleVoteAction = (e: React.MouseEvent, action: 'like' | 'dislike') => {
        e.stopPropagation();
        e.preventDefault();

        if (!currentUser && !unlimitedVotes) {
            onVote?.(message.id, action, false);
            return;
        }

        if (unlimitedVotes) {
            if (action === 'like') {
                setOptimisticLikes(prev => prev + 1);
                setOptimisticHasLiked(true); // Always turn active
                setLikeAnimation(true);
                setTimeout(() => setLikeAnimation(false), 600);
            } else {
                setOptimisticDislikes(prev => prev + 1);
                setOptimisticHasDisliked(true); // Always turn active
                setDislikeAnimation(true);
                setTimeout(() => setDislikeAnimation(false), 600);
            }
            onVote?.(message.id, action, true);
            return;
        }

        if (action === 'like') {
            if (optimisticHasLiked) {
                setOptimisticLikes(prev => Math.max(0, prev - 1));
                setOptimisticHasLiked(false);
            } else {
                setOptimisticLikes(prev => prev + 1);
                setOptimisticHasLiked(true);
                if (optimisticHasDisliked) {
                    setOptimisticDislikes(prev => Math.max(0, prev - 1));
                    setOptimisticHasDisliked(false);
                }
                setLikeAnimation(true);
                setTimeout(() => setLikeAnimation(false), 600);
            }
        } else {
            if (optimisticHasDisliked) {
                setOptimisticDislikes(prev => Math.max(0, prev - 1));
                setOptimisticHasDisliked(false);
            } else {
                setOptimisticDislikes(prev => prev + 1);
                setOptimisticHasDisliked(true);
                if (optimisticHasLiked) {
                    setOptimisticLikes(prev => Math.max(0, prev - 1));
                    setOptimisticHasLiked(false);
                }
                setDislikeAnimation(true);
                setTimeout(() => setDislikeAnimation(false), 600);
            }
        }
        onVote?.(message.id, action, false);
    };

    if (orientation === 'corner') {
        return (
            <>
                <button
                    onClick={(e) => handleVoteAction(e, 'like')}
                    className={`vote-badge absolute -top-2 -right-2 min-w-[32px] h-7 px-2 flex items-center justify-center gap-1 bg-gradient-to-br from-green-500/95 to-emerald-600/95 backdrop-blur-sm rounded-full border-2 border-green-300/40 shadow-lg cursor-pointer hover:scale-110 transition-all z-10 ${optimisticHasLiked ? 'ring-2 ring-white ring-offset-1 ring-offset-green-500' : ''} ${likeAnimation ? 'vote-animate' : ''}`}
                >
                    <svg className="w-3.5 h-3.5" fill="white" viewBox="0 0 24 24">
                        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 11H4a2 2 0 00-2 2v6a2 2 0 002 2h3" />
                    </svg>
                    <span className="text-xs font-bold text-white">{optimisticLikes}</span>
                </button>
                <button
                    onClick={(e) => handleVoteAction(e, 'dislike')}
                    className={`vote-badge absolute -bottom-2 -right-2 min-w-[32px] h-7 px-2 flex items-center justify-center gap-1 bg-gradient-to-br from-red-500/95 to-rose-600/95 backdrop-blur-sm rounded-full border-2 border-red-300/40 shadow-lg cursor-pointer hover:scale-110 transition-all z-10 ${optimisticHasDisliked ? 'ring-2 ring-white ring-offset-1 ring-offset-red-500' : ''} ${dislikeAnimation ? 'vote-animate' : ''}`}
                >
                    <svg className="w-3.5 h-3.5" fill="white" viewBox="0 0 24 24">
                        <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h3a2 2 0 012 2v6a2 2 0 01-2 2h-3" />
                    </svg>
                    <span className="text-xs font-bold text-white">{optimisticDislikes}</span>
                </button>
            </>
        );
    }

    return (
        <div className="flex items-center space-x-3" onClick={e => e.stopPropagation()}>
            <button
                onClick={(e) => handleVoteAction(e, 'like')}
                className={`flex items-center space-x-1 transition-all ${optimisticHasLiked ? 'text-green-400' : 'text-gray-400 hover:text-green-400'} ${likeAnimation ? 'vote-animate' : ''}`}
            >
                <div className={`p-1.5 rounded-full transition-colors ${optimisticHasLiked ? 'bg-green-500/20' : 'bg-white/5 hover:bg-green-500/20'}`}>
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill={optimisticHasLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                </div>
                <span className="text-sm font-bold">{optimisticLikes}</span>
            </button>

            <button
                onClick={(e) => handleVoteAction(e, 'dislike')}
                className={`flex items-center space-x-1 transition-all ${optimisticHasDisliked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'} ${dislikeAnimation ? 'vote-animate' : ''}`}
            >
                <div className={`p-1.5 rounded-full transition-colors ${optimisticHasDisliked ? 'bg-red-500/20' : 'bg-white/5 hover:bg-red-500/20'}`}>
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill={optimisticHasDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                </div>
                <span className="text-sm font-bold">{optimisticDislikes}</span>
            </button>
        </div>
    );
};

// Message Marker Component
// Premium Message Bubble Component
const MessageMarker = ({
    message,
    onClick,
    onVote,
    currentUser,
    unlimitedVotes = false
}: {
    message: Message & { hiddenCount?: number };
    onClick?: () => void;
    onVote?: (id: string, action: 'like' | 'dislike', unlimited: boolean) => void;
    currentUser?: any;
    unlimitedVotes?: boolean;
}) => {


    return (
        <div
            onClick={onClick}
            className="cursor-pointer group pointer-events-auto"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
                zIndex: (message.likes || 0) + 10, // Higher likes on top
            }}
        >
            {/* Chat bubble */}
            <div
                className="message-bubble bubble-popup"
                style={{
                    position: 'relative',
                    maxWidth: '240px',
                    padding: '8px 12px 8px 8px',
                    background: 'linear-gradient(135deg, rgba(123, 44, 191, 0.95) 0%, rgba(157, 78, 221, 0.95) 100%)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(199, 125, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(123, 44, 191, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'translateY(0)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(157, 78, 221, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(123, 44, 191, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
            >
                {/* Clustering Badge - Top Left - Larger */}
                {(message.hiddenCount ?? 0) > 0 && (
                    <div className="absolute -top-3 -left-3 bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full border-2 border-purple-900 shadow-lg z-10">
                        +{message.hiddenCount}
                    </div>
                )}

                {/* Vote Controls Component */}
                <VoteControls
                    message={message}
                    onVote={onVote}
                    currentUser={currentUser}
                    unlimitedVotes={unlimitedVotes}
                    orientation="corner"
                />

                {/* Shine effect */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '50%',
                        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.15), transparent)',
                        borderRadius: '24px 24px 0 0',
                        pointerEvents: 'none',
                        zIndex: 0
                    }}
                />

                {/* User Avatar */}
                <div className="relative z-10 w-8 h-8 shrink-0 message-avatar">
                    {message.userImage ? (
                        <img
                            src={message.userImage}
                            alt={message.userName}
                            className="w-full h-full rounded-full object-cover border-2 border-white/20"
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-indigo-500 flex items-center justify-center border-2 border-white/20 text-xs font-bold">
                            {message.userName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-col relative z-10 min-w-0 flex-1 message-content">
                    <span className="message-text" style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: '1.2'
                    }}>
                        {message.text}
                    </span>
                    <div className="flex items-center mt-0.5 space-x-2">
                        <span className="message-meta" style={{
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.7)',
                            fontWeight: 600
                        }}>
                            @{message.userName.split(' ')[0]} • {formatRelativeTime(message.timestamp)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tail/pointer */}
            <div
                className="bubble-popup"
                style={{
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '10px solid rgba(157, 78, 221, 0.95)',
                    marginTop: '-1px',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                }}
            />

            <style jsx>{`
                .bubble-popup {
                    opacity: 0;
                    transform: scale(0);
                    animation: popUpBubble 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.15s forwards;
                }

                @keyframes popUpBubble {
                    0% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes slideUpScale {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .vote-animate {
                    animation: voteClick 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes voteClick {
                    0% {
                        transform: scale(1);
                    }
                    25% {
                        transform: scale(1.3) rotate(-10deg);
                    }
                    50% {
                        transform: scale(1.1) rotate(5deg);
                    }
                    75% {
                        transform: scale(1.15) rotate(-3deg);
                    }
                    100% {
                        transform: scale(1);
                    }
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
                        min-width: 28px !important;
                        height: 24px !important;
                        font-size: 10px !important;
                        padding: 0 6px !important;
                    }
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
    const { location, error: locationError } = useLocation();
    const { messages, voteMessage } = useMessages();
    const mapRef = useRef<MapRef>(null);
    const router = useRouter();
    const { data: session } = useSession();

    const [viewState, setViewState] = useState({
        latitude: 41.0082,
        longitude: 28.9784,
        zoom: 12,
    });

    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [locationName, setLocationName] = useState<string | null>(null);

    const { expirationHours, minLikesForZoom, isSimulationMode, unlimitedVotes, clusterRadius } = useConfig();

    // Update selected message if it's updated in the global list
    useEffect(() => {
        if (selectedMessage) {
            const updated = messages.find(m => m.id === selectedMessage.id);
            if (updated) {
                setSelectedMessage(updated);
            }
        }
    }, [messages, selectedMessage?.id]);

    // Smart Clustering Logic
    const clusteredMessages = useMemo(() => {
        const now = Date.now();
        const expirationMs = expirationHours * 60 * 60 * 1000;

        // 1. Filter valid messages
        const validMessages = messages.filter(msg => {
            if (now - msg.timestamp > expirationMs) return false;
            return true;
        });

        // 2. Sort by Importance (Likes DESC, then Time DESC)
        const sortedMessages = [...validMessages].sort((a, b) => {
            const likesA = (a.likes || 0);
            const likesB = (b.likes || 0);
            if (likesA !== likesB) return likesB - likesA; // Higher likes first
            return b.timestamp - a.timestamp; // Newer first
        });

        // 3. Dynamic Threshold based on Zoom
        // The radius scales exponentially with zoom level
        // Base radius comes from config (default 0.005 ~= 500m at zoom 12)
        const ZOOM_FACTOR = Math.pow(2, 12 - viewState.zoom);
        const CLUSTER_RADIUS = clusterRadius * ZOOM_FACTOR;

        const clusters: (Message & { hiddenCount: number })[] = [];
        const processed = new Set<string>();

        // 4. Greedy Clustering
        for (const msg of sortedMessages) {
            if (processed.has(msg.id)) continue;

            let hiddenCount = 0;

            // Find all neighbors that fall into this message's radius
            for (const otherMsg of sortedMessages) {
                if (msg.id === otherMsg.id || processed.has(otherMsg.id)) continue;

                const distance = Math.sqrt(
                    Math.pow(msg.lat - otherMsg.lat, 2) +
                    Math.pow(msg.lng - otherMsg.lng, 2)
                );

                if (distance < CLUSTER_RADIUS) {
                    hiddenCount++;
                    processed.add(otherMsg.id); // Mark neighbor as processed (hidden)
                }
            }

            clusters.push({ ...msg, hiddenCount });
            processed.add(msg.id); // Mark self
        }

        return clusters;
    }, [messages, viewState.zoom, expirationHours, clusterRadius]);

    // Handle voting
    const handleVote = async (id: string, action: 'like' | 'dislike', unlimited: boolean) => {
        await voteMessage(id, action, unlimited);
    };

    // Fly to marker location on click and select message
    const handleMarkerClick = (msg: Message) => {
        setSelectedMessage(msg);
        setLocationName(null); // Reset location name while fetching

        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [msg.lng, msg.lat],
                zoom: 16,
                duration: 1500,
                essential: true
            });
        }
    };

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

    // Sync with user location once found
    useEffect(() => {
        if (location) {
            setViewState((prev) => ({
                ...prev,
                latitude: location.lat,
                longitude: location.lng,
                zoom: 15,
            }));
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
            <Map
                ref={mapRef}
                {...viewState}
                onMove={(evt: any) => setViewState(evt.viewState)}
                onMoveStart={() => {
                    // Close details overlay when user starts panning
                    if (selectedMessage) {
                        setSelectedMessage(null);
                    }
                }}
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
                    }
                }}
            >
                {/* User Location */}
                {location && (
                    <Marker latitude={location.lat} longitude={location.lng} anchor="center">
                        <UserLocationMarker />
                    </Marker>
                )}

                {/* Messages with Clustering */}
                {clusteredMessages.map((msg, index) => (
                    <Marker
                        key={msg.id}
                        latitude={msg.lat}
                        longitude={msg.lng}
                        anchor="bottom"
                        onClick={(e: any) => {
                            e.originalEvent.stopPropagation();
                            handleMarkerClick(msg);
                        }}
                    >
                        <div style={{ animationDelay: `${150 + index * 30}ms` }}>
                            <MessageMarker
                                message={msg}
                                onVote={handleVote}
                                currentUser={session?.user}
                                unlimitedVotes={unlimitedVotes}
                            />
                        </div>
                    </Marker>
                ))}

                <GeolocateControl position="bottom-right" />
                <NavigationControl position="bottom-right" showCompass={false} />
            </Map>

            {/* Message Details Overlay - Compact Design */}
            {selectedMessage && (
                <div
                    className="absolute bottom-32 left-4 right-4 md:left-auto md:right-4 md:top-20 md:bottom-auto md:w-72 z-50 pointer-events-auto max-w-sm mx-auto md:mx-0"
                    style={{
                        animation: 'slideUpScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                    }}
                >
                    <div className="bg-black/70 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-2xl overflow-hidden relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedMessage(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/60 hover:text-white transition-all z-10"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* User Header - Compact */}
                        <div
                            className="flex items-center space-x-2 mb-3 cursor-pointer hover:opacity-80 transition-opacity pr-6"
                            onClick={() => selectedMessage.userId && router.push(`/profile/${selectedMessage.userId}`)}
                        >
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-cyan-500 flex-shrink-0">
                                {selectedMessage.userImage ? (
                                    <img
                                        src={selectedMessage.userImage}
                                        alt={selectedMessage.userName}
                                        className="w-full h-full rounded-full object-cover border-2 border-black"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center border-2 border-black font-bold text-white text-xs">
                                        {selectedMessage.userName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-white font-bold text-sm md:text-base leading-tight truncate">{selectedMessage.userName}</h3>
                                <p className="text-cyan-400 text-[10px] md:text-xs font-medium">Tap to view profile</p>
                            </div>
                        </div>

                        {/* Message Body - Compact */}
                        <div className="mb-3">
                            <p className="text-white text-sm md:text-base leading-snug">
                                "{selectedMessage.text}"
                            </p>
                        </div>

                        {/* Voting Controls - Large Horizontal */}
                        <div className="mb-3 pb-3 border-b border-white/10 flex items-center justify-between">
                            <VoteControls
                                message={selectedMessage}
                                onVote={handleVote}
                                currentUser={session?.user}
                                unlimitedVotes={unlimitedVotes}
                                orientation="horizontal"
                            />
                            <span className="text-[10px] text-white/40 font-mono tracking-wider uppercase">
                                {(selectedMessage.likes || 0) + (selectedMessage.dislikes || 0)} votes
                            </span>
                        </div>

                        {/* Meta Info - Compact */}
                        <div className="space-y-2">
                            {/* Time */}
                            <div className="flex items-center text-xs text-gray-300">
                                <svg className="w-3.5 h-3.5 mr-1.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formatRelativeTime(selectedMessage.timestamp)} ago</span>
                            </div>

                            {/* Location - Compact */}
                            <div className="flex items-start text-xs text-gray-300">
                                <svg className="w-3.5 h-3.5 mr-1.5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-white/90 truncate">
                                        {locationName || "Locating..."}
                                    </p>
                                    <p className="text-[10px] text-white/40 truncate">
                                        {selectedMessage.lat.toFixed(5)}, {selectedMessage.lng.toFixed(5)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {locationError && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded shadow-md z-10 text-xs">
                    Location Error: {locationError.message}
                </div>
            )}
        </div>
    );
}
