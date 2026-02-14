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
import { useUser } from "@/hooks/useUser";
import { useUI } from "@/context/UIContext";
import { UserPlus, Check, Clock } from "lucide-react";

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
    const userId = currentUser?.id || "anonymous";

    // helper to robustly check inclusion
    const hasUserVoted = (list: string[] | undefined, uid: string) => {
        if (!list || !Array.isArray(list)) return false;
        // console.log('Checking vote:', { list, uid, result: list.includes(uid) });
        return list.includes(uid);
    };

    const initialHasLiked = hasUserVoted(message.likedBy, userId);
    const initialHasDisliked = hasUserVoted(message.dislikedBy, userId);

    const [optimisticHasLiked, setOptimisticHasLiked] = useState(initialHasLiked);
    const [optimisticHasDisliked, setOptimisticHasDisliked] = useState(initialHasDisliked);

    const [likeAnimation, setLikeAnimation] = useState(false);
    const [dislikeAnimation, setDislikeAnimation] = useState(false);

    useEffect(() => {
        setOptimisticLikes(message.likes || 0);
        setOptimisticDislikes(message.dislikes || 0);
        setOptimisticHasLiked(hasUserVoted(message.likedBy, userId));
        setOptimisticHasDisliked(hasUserVoted(message.dislikedBy, userId));
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
            console.log('Follow-up vote debug:', { hasLiked: optimisticHasLiked, likes: optimisticLikes, userId });
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
    unlimitedVotes = false,
    isSelected = false,
    isNearCenter = true,
    zoom = 12
}: {
    message: Message & { hiddenCount?: number };
    onClick?: () => void;
    onVote?: (id: string, action: 'like' | 'dislike', unlimited: boolean) => void;
    currentUser?: any;
    unlimitedVotes?: boolean;
    isSelected?: boolean;
    isNearCenter?: boolean;
    zoom?: number;
}) => {
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
                    {/* Small dot */}
                    <div
                        className="w-2 h-2 rounded-full border border-white shadow-md transition-all hover:scale-150"
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

    // CSS Variables for dynamic coloring
    const bubbleStyle = {
        '--bubble-bg': isFriends
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(123, 44, 191, 0.95) 0%, rgba(157, 78, 221, 0.95) 100%)',
        '--bubble-border': isFriends
            ? '1px solid rgba(52, 211, 153, 0.3)'
            : '1px solid rgba(199, 125, 255, 0.3)',
        '--bubble-shadow': isFriends
            ? '0 8px 32px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            : '0 8px 32px rgba(123, 44, 191, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        '--bubble-shadow-hover': isFriends
            ? '0 12px 40px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            : '0 12px 40px rgba(157, 78, 221, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        '--tail-color': isFriends
            ? 'rgba(5, 150, 105, 0.95)'
            : 'rgba(157, 78, 221, 0.95)',
        '--outline': isSelected ? '3px solid rgba(255, 255, 255, 0.9)' : 'none',
        zIndex: (isFriends ? 1000 : 0) + (message.likes || 0) + 10,
    } as React.CSSProperties;

    return (
        <div
            onClick={onClick}
            className="cursor-pointer group pointer-events-auto message-container"
            style={bubbleStyle}
        >
            {/* Chat bubble */}
            <div className="message-bubble bubble-popup">
                {/* Clustering Badge - Top Left - Larger */}
                {(message.hiddenCount ?? 0) > 0 && (
                    <div className="absolute -top-3 -left-3 bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full border-2 border-purple-900 shadow-lg z-10">
                        +{message.hiddenCount}
                    </div>
                )}

                {/* Vote Controls Component - Show based on zoom level */}
                {zoom >= 14 && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <VoteControls
                            message={message}
                            onVote={onVote}
                            currentUser={currentUser}
                            unlimitedVotes={unlimitedVotes}
                            orientation="corner"
                        />
                    </div>
                )}

                {/* Shine effect */}
                <div className="bubble-shine" />

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
                    <span className="message-text">
                        {message.text}
                    </span>
                    <div className="flex items-center mt-0.5 space-x-2">
                        <span className="message-meta">
                            {message.userName} • {formatRelativeTime(message.timestamp)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tail/pointer */}
            <div className="bubble-tail bubble-popup" />

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
                    /* Ensure no default transform interferes with animation */
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

                .bubble-popup {
                    opacity: 0;
                    transform: scale(0);
                    transform-origin: bottom center;
                    animation: popUpBubble 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
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

    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [detailsMessage, setDetailsMessage] = useState<Message | null>(null);
    const [selectedFriend, setSelectedFriend] = useState<any | null>(null);

    // Track programmatic movements to avoid closing popup during flyTo
    const isProgrammaticMove = useRef(false);

    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [locationName, setLocationName] = useState<string | null>(null);

    const { expirationHours, minLikesForZoom, isSimulationMode, unlimitedVotes, clusterRadius } = useConfig();
    const { user: currentUserData, handleFriendRequest } = useUser();
    const { setMessageDetailsOpen } = useUI();

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

    // Update bounds on move end to re-calculate visible messages
    const handleMoveEnd = (evt: any) => {
        if (evt.target) {
            setViewportBounds(evt.target.getBounds());
            // Also close details if moving
        }
    };

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
    }, []);


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

    // Smart clustering: when zoomed out, identify most-liked post in each region to show as BUBBLE
    // This is "Phase 1" clustering - identifying the Highlights
    const postsToShowAsBubbles = useMemo(() => {
        const bubbleSet = new Set<string>();
        const processed = new Set<string>();

        // Dynamic cluster radius for Bubbles
        const baseRadius = clusterRadius;
        const zoomFactor = Math.pow(2, 13 - viewState.zoom);
        const clusterRadiusLat = baseRadius * zoomFactor;
        const clusterRadiusLng = clusterRadiusLat / Math.cos(viewState.latitude * Math.PI / 180);

        // Helper to calculate score for Bubble eligibility
        const getScore = (msg: Message) => {
            let score = (msg.likes || 0);
            if (msg.visibility === 'friends') score += 50;
            const ageHours = (Date.now() - msg.timestamp) / (1000 * 60 * 60);
            if (ageHours < 1) score += 5;
            return score;
        };

        const sortedMessages = [...visibleMessages].sort((a, b) => {
            const scoreA = getScore(a);
            const scoreB = getScore(b);
            return scoreB - scoreA;
        });

        for (const msg of sortedMessages) {
            if (processed.has(msg.id)) continue;

            // This message is a Bubble Leader
            bubbleSet.add(msg.id);
            processed.add(msg.id);

            // Mark nearby messages as processed FOR THE PURPOSE OF BUBBLE SELECTION
            // If a post is near a bubble, it cannot be another bubble.
            // But it CAN be a dot or part of a dot cluster.
            for (const other of visibleMessages) {
                if (other.id === msg.id || processed.has(other.id)) continue;

                const latDiff = Math.abs(other.lat - msg.lat);
                const lngDiff = Math.abs(other.lng - msg.lng);

                if (latDiff < clusterRadiusLat && lngDiff < clusterRadiusLng) {
                    processed.add(other.id);
                }
            }
        }

        return bubbleSet;
    }, [visibleMessages, viewState.zoom, viewState.latitude, clusterRadius]);

    // Identify Dots (Messages that are NOT Bubbles)
    const visibleDots = useMemo(() => {
        return visibleMessages.filter(msg => !postsToShowAsBubbles.has(msg.id));
    }, [visibleMessages, postsToShowAsBubbles]);

    // Secondary Clustering: Cluster the Dots
    // "Phase 2" clustering - grouping the Lowlights
    const dotClusters = useMemo(() => {
        const clusters: { id: string, lat: number, lng: number, count: number, ids: string[] }[] = [];
        const processed = new Set<string>();

        // Dot clustering radius can be slightly smaller or same as bubble radius
        const baseRadius = clusterRadius * 0.8;
        const zoomFactor = Math.pow(2, 13 - viewState.zoom);
        const clusterRadiusLat = baseRadius * zoomFactor;
        const clusterRadiusLng = clusterRadiusLat / Math.cos(viewState.latitude * Math.PI / 180);

        // Sort by ID for deterministic clustering order
        // This prevents clusters from slightly shifting if the array order changes
        const sortedDots = [...visibleDots].sort((a, b) => a.id.localeCompare(b.id));

        for (const msg of sortedDots) {
            if (processed.has(msg.id)) continue;

            const cluster = {
                id: msg.id, // Use the leader's ID as the stable cluster ID
                lat: msg.lat,
                lng: msg.lng,
                count: 1,
                ids: [msg.id]
            };
            processed.add(msg.id);

            for (const other of sortedDots) {
                if (other.id === msg.id || processed.has(other.id)) continue;

                const latDiff = Math.abs(other.lat - msg.lat);
                const lngDiff = Math.abs(other.lng - msg.lng);

                if (latDiff < clusterRadiusLat && lngDiff < clusterRadiusLng) {
                    cluster.count++;
                    cluster.ids.push(other.id);
                    // Average the location? Or keep leader location?
                    // Averaging looks smoother
                    cluster.lat = (cluster.lat * (cluster.count - 1) + other.lat) / cluster.count;
                    cluster.lng = (cluster.lng * (cluster.count - 1) + other.lng) / cluster.count;

                    processed.add(other.id);
                }
            }

            if (cluster.count > 1) {
                clusters.push(cluster);
            }
        }
        return clusters;
    }, [visibleDots, viewState.zoom, viewState.latitude, clusterRadius]);

    // Remaining Single Dots (Not in any dot cluster)
    // We can just filter them or return them from the loop above.
    // Actually, let's make a Set of clustered IDs
    const clusteredDotIds = useMemo(() => {
        const ids = new Set<string>();
        dotClusters.forEach(c => c.ids.forEach(id => ids.add(id)));
        return ids;
    }, [dotClusters]);


    // Calculate which messages are near screen center for vote button visibility
    const markersNearCenter = useMemo(() => {
        const centerLat = viewState.latitude;
        const centerLng = viewState.longitude;
        const threshold = 0.02 / Math.pow(2, viewState.zoom - 12); // Adjust threshold based on zoom

        return new Set(
            visibleMessages
                .filter(msg => {
                    const latDiff = Math.abs(msg.lat - centerLat);
                    const lngDiff = Math.abs(msg.lng - centerLng);
                    return latDiff < threshold && lngDiff < threshold;
                })
                .map(msg => msg.id)
        );
    }, [visibleMessages, viewState.latitude, viewState.longitude, viewState.zoom]);

    // Handle voting
    const handleVote = async (id: string, action: 'like' | 'dislike', unlimited: boolean) => {
        await voteMessage(id, action, unlimited);
    };

    // Fly to marker location on click and select message
    const handleMarkerClick = (msg: Message) => {
        // Always set the message and open details, even if already selected
        setSelectedMessage(msg);
        setMessageDetailsOpen(true);
        setLocationName(null); // Reset location name while fetching

        if (mapRef.current) {
            // Only fly to location if it's a different message
            if (selectedMessage?.id !== msg.id) {
                isProgrammaticMove.current = true;
                mapRef.current.flyTo({
                    center: [msg.lng, msg.lat],
                    zoom: 16,
                    duration: 1500,
                    essential: true
                });
                // Reset flag after animation completes
                setTimeout(() => {
                    isProgrammaticMove.current = false;
                }, 1600);
            }
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
                onMove={(evt) => {
                    setViewState(evt.viewState);
                    // Close friend popup only on user-initiated movement, not programmatic flyTo
                    if (selectedFriend && !isProgrammaticMove.current) {
                        setSelectedFriend(null);
                    }
                }}
                onMoveStart={() => {
                    // Close details overlay when user starts panning
                    if (selectedMessage) {
                        setSelectedMessage(null);
                        setMessageDetailsOpen(false);
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
                    }
                }}
            >
                {/* User Location */}
                {location && (
                    <Marker latitude={location.lat} longitude={location.lng} anchor="center">
                        <UserLocationMarker />
                    </Marker>
                )}

                {/* Friend Markers */}
                {currentUserData?.friends?.map((friend) => (
                    friend.lastLat && friend.lastLng ? (
                        <Marker
                            key={`friend-${friend.id}`}
                            longitude={friend.lastLng}
                            latitude={friend.lastLat}
                            anchor="bottom"
                            onClick={(e) => {
                                e.originalEvent.stopPropagation();
                                // Focus on friend location and show popup
                                if (friend.lastLat && friend.lastLng) {
                                    setSelectedFriend(friend);
                                    isProgrammaticMove.current = true;
                                    mapRef.current?.flyTo({
                                        center: [friend.lastLng, friend.lastLat],
                                        zoom: 15,
                                        duration: 1000
                                    });
                                    // Reset flag after animation completes
                                    setTimeout(() => {
                                        isProgrammaticMove.current = false;
                                    }, 1000);
                                }
                            }}
                        >
                            <div className="group relative cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full border-2 border-purple-500 shadow-lg overflow-hidden bg-black relative transform transition-transform group-hover:scale-110">
                                        {friend.image ? (
                                            <img src={friend.image} alt={friend.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white font-bold">
                                                {friend.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    {/* Online Status Indicator */}
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${friend.lastSeen && (Date.now() - new Date(friend.lastSeen).getTime() < 5 * 60 * 1000)
                                        ? 'bg-green-500'
                                        : 'bg-gray-500'
                                        }`}></div>
                                </div>
                                {/* Tooltip - Absolutely positioned to not affect anchor */}
                                <div className="absolute top-full mt-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center whitespace-nowrap pointer-events-none">
                                    <span className="text-[10px] text-white font-medium">{friend.name}</span>
                                    {friend.lastSeen && (
                                        <span className="text-[9px] text-gray-300">
                                            {Date.now() - new Date(friend.lastSeen).getTime() < 5 * 60 * 1000
                                                ? 'Online'
                                                : `Seen ${formatRelativeTime(new Date(friend.lastSeen).getTime())} ago`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Marker>
                    ) : null
                ))}

                {/* Friend Popup */}
                {selectedFriend && selectedFriend.lastLat && selectedFriend.lastLng && (
                    <Marker
                        latitude={selectedFriend.lastLat}
                        longitude={selectedFriend.lastLng}
                        anchor="bottom"
                    >
                        <div
                            className="animate-in zoom-in-95 duration-300 pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-gradient-to-br from-emerald-900/95 to-black/95 backdrop-blur-xl border-2 border-emerald-500/50 rounded-2xl shadow-2xl p-4 min-w-[200px]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-2 border-emerald-400 shadow-lg overflow-hidden bg-black">
                                            {selectedFriend.image ? (
                                                <img src={selectedFriend.image} alt={selectedFriend.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center border-2 border-black font-bold text-xl">
                                                    {selectedFriend.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${selectedFriend.lastSeen && (Date.now() - new Date(selectedFriend.lastSeen).getTime() < 5 * 60 * 1000)
                                            ? 'bg-green-500'
                                            : 'bg-gray-500'
                                            }`}></div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-sm">{selectedFriend.name}</h3>
                                        <p className="text-emerald-300 text-xs">@{selectedFriend.username || selectedFriend.name.toLowerCase()}</p>
                                    </div>
                                </div>
                                {selectedFriend.lastSeen && (
                                    <div className="flex items-center gap-2 text-xs text-gray-300 bg-black/40 rounded-lg px-3 py-2">
                                        <Clock size={12} className="text-emerald-400" />
                                        <span>
                                            {Date.now() - new Date(selectedFriend.lastSeen).getTime() < 5 * 60 * 1000
                                                ? 'Online now'
                                                : `Last seen ${formatRelativeTime(new Date(selectedFriend.lastSeen).getTime())} ago`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Marker>
                )}

                {/* 1. BUBBLES: Posts to show as full bubbles */}
                {visibleMessages.filter(msg => postsToShowAsBubbles.has(msg.id)).map((msg, index) => (
                    <Marker
                        key={`bubble-${msg.id}`}
                        latitude={msg.lat}
                        longitude={msg.lng}
                        anchor="bottom"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            handleMarkerClick(msg);
                        }}
                    >
                        <div className={`transition-all duration-300 ${selectedFriend ? 'blur-sm opacity-50' : ''}`} style={{ animationDelay: `${150 + index * 30}ms` }}>
                            <MessageMarker
                                message={msg} // No hiddenCount on bubbles anymore
                                onVote={handleVote}
                                currentUser={currentUserData}
                                unlimitedVotes={unlimitedVotes}
                                isSelected={selectedMessage?.id === msg.id}
                                isNearCenter={true} // Bubbles are always "Near Center" style (expanded)
                                zoom={viewState.zoom}
                            />
                        </div>
                    </Marker>
                ))}

                {/* 2. CLUSTERS: Groups of dots (lowlights) */}
                {dotClusters.map((cluster, i) => (
                    <Marker
                        key={`cluster-${cluster.id}`} // Use stable ID as key
                        latitude={cluster.lat}
                        longitude={cluster.lng}
                        anchor="center"
                    >
                        <div
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600/90 border-2 border-white/50 shadow-lg text-white font-bold text-xs cursor-pointer hover:scale-110 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                mapRef.current?.flyTo({
                                    center: [cluster.lng, cluster.lat],
                                    zoom: viewState.zoom + 2,
                                    duration: 800
                                });
                            }}
                        >
                            {cluster.count}
                        </div>
                    </Marker>
                ))}

                {/* 3. DOTS: Single lowlight posts */}
                {visibleDots.filter(msg => !clusteredDotIds.has(msg.id)).map((msg) => (
                    <Marker
                        key={`dot-${msg.id}`}
                        latitude={msg.lat}
                        longitude={msg.lng}
                        anchor="center"
                        onClick={(e) => {
                            e.originalEvent.stopPropagation();
                            handleMarkerClick(msg);
                        }}
                    >
                        <div className={`cursor-pointer transition-transform duration-300 hover:scale-150 ${selectedFriend ? 'blur-sm opacity-50' : ''}`}>
                            <div className="w-2 h-2 rounded-full border border-white shadow-md bg-indigo-500" />
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
                            onClick={() => {
                                setSelectedMessage(null);
                                setMessageDetailsOpen(false);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/60 hover:text-white transition-all z-10"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* User Header - Compact */}
                        <div
                            className="flex items-center space-x-2 mb-3 cursor-pointer hover:opacity-80 transition-opacity pr-6"
                            onClick={() => selectedMessage.userId && router.push(`/profile?id=${selectedMessage.userId}`)}
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
                                <p className="text-cyan-400 text-[10px] md:text-xs font-medium">
                                    {selectedMessage.isAnonymous ? "Anonymous User" : "Tap to view profile"}
                                </p>
                            </div>

                            {/* Add Friend Button */}
                            {currentUserData && !selectedMessage.isAnonymous && getFriendStatus(selectedMessage.userId) !== 'self' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddFriend(selectedMessage.userId);
                                    }}
                                    disabled={getFriendStatus(selectedMessage.userId) !== 'none'}
                                    className={`p-2 rounded-full transition-all ${getFriendStatus(selectedMessage.userId) === 'friend' ? 'bg-green-500/20 text-green-400' :
                                        getFriendStatus(selectedMessage.userId) === 'sent' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                >
                                    {getFriendStatus(selectedMessage.userId) === 'friend' ? <Check size={16} /> :
                                        getFriendStatus(selectedMessage.userId) === 'sent' ? <Clock size={16} /> :
                                            <UserPlus size={16} />}
                                </button>
                            )}
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
