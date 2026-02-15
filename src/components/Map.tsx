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
import { UserPlus, Check, Clock, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MessageDetails from "./MessageDetails";
import VoteControls from "./VoteControls";

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

const FOG_CONFIG = {
    range: [0.5, 10] as [number, number],
    color: "#240046",
    "high-color": "#1a0033",
    "space-color": "#050011",
    "horizon-blend": 0.05,
    "star-intensity": 0.5
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
    onClick?: (e?: React.MouseEvent) => void;
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
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}
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
                    /* More visible white outline for contrast against purple map */
                    box-shadow: var(--bubble-shadow), 0 0 0 1px rgba(255, 255, 255, 0.4);
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

    // Track if we have already centered on user location to prevent loops
    const hasCentered = useRef(false);

    // Initialize/Restore Map State
    useEffect(() => {
        try {
            const savedState = localStorage.getItem('geogram_map_view_state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed && typeof parsed.latitude === 'number') {
                    setViewState(parsed);
                    hasCentered.current = true; // Assume we are already where we want to be
                }
            }
        } catch (e) {
            console.error("Failed to restore map state", e);
        }
    }, []);

    // Save Map State on Move
    const handleMoveEnd = (evt: any) => {
        if (evt.target) {
            setViewportBounds(evt.target.getBounds());

            // Save current state
            const newState = evt.viewState;
            setViewState(newState); // Update local state

            // Persist to localStorage
            try {
                localStorage.setItem('geogram_map_view_state', JSON.stringify({
                    latitude: newState.latitude,
                    longitude: newState.longitude,
                    zoom: newState.zoom
                }));
            } catch (e) {
                // Ignore storage errors
            }
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
                    padding: { top: 450 },
                    duration: 600,
                    essential: true
                });
                setTimeout(() => {
                    isProgrammaticMove.current = false;
                }, 800); // Longer timeout than flyTo duration to prevent premature closing
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

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false); // New state for toggle

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
        setSearchQuery(feature.place_name);
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
            {/* Search Bar Overlay - Top Right */}
            <div
                className={`absolute top-4 right-4 z-50 transition-all duration-300 ease-in-out ${isSearchOpen ? 'w-[70%] max-w-sm' : 'w-12 h-12'
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
                    {isSearchOpen && (
                        <div className="relative w-full animate-in fade-in zoom-in-95 duration-200">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-purple-300" />
                            </div>
                            <input
                                autoFocus
                                type="text"
                                className="block w-full pl-9 pr-9 py-3 bg-[#1a0033]/90 backdrop-blur-xl border border-purple-500/50 rounded-full text-base text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-2xl shadow-purple-900/50"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                onBlur={() => {
                                    // Delay collapse to allow clicking results
                                    setTimeout(() => {
                                        if (!searchQuery) setIsSearchOpen(false);
                                    }, 200);
                                }}
                            />
                            <button
                                onClick={() => {
                                    clearSearch();
                                    setIsSearchOpen(false);
                                }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
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

            <Map
                ref={mapRef}
                {...viewState}
                // light prop removed to fix deprecation warning
                onMove={(evt) => {
                    const previousZoom = viewState.zoom;
                    setViewState(evt.viewState);

                    // Close details on any zoom change (slow or fast)
                    if (!isProgrammaticMove.current && selectedMessage && Math.abs(evt.viewState.zoom - previousZoom) > 0.01) {
                        setSelectedMessage(null);
                        setMessageDetailsOpen(false);
                    }

                    // Close friend popup only on user-initiated movement, not programmatic flyTo
                    if (selectedFriend && !isProgrammaticMove.current) {
                        setSelectedFriend(null);
                    }
                }}
                onMoveStart={() => {
                    if (!isProgrammaticMove.current && selectedMessage) {
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
                projection="globe"
                fog={FOG_CONFIG}
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
                <AnimatePresence>
                    {visibleMessages.filter(msg => postsToShowAsBubbles.has(msg.id)).map((msg, index) => (
                        <Marker
                            key={`bubble-${msg.id}`}
                            latitude={msg.lat}
                            longitude={msg.lng}
                            anchor="bottom"
                        >
                            {/* Only show marker if it's NOT the selected one (expanding) */}
                            {selectedMessage?.id !== msg.id && (
                                <motion.div
                                    layoutId={`message-container-${msg.id}`}
                                    className={`transition-all duration-300 ${selectedFriend ? 'blur-sm opacity-50' : ''}`}
                                    style={{
                                        animationDelay: `${150 + index * 30}ms`,
                                        zIndex: 10 // Ensure lower z-index than expanded details
                                    }}
                                >
                                    <MessageMarker
                                        message={msg} // No hiddenCount on bubbles anymore
                                        onVote={handleVote}
                                        onClick={() => handleMarkerClick(msg)}
                                        currentUser={currentUserData}
                                        unlimitedVotes={unlimitedVotes}
                                        isSelected={selectedMessage?.id === msg.id}
                                        isNearCenter={true} // Bubbles are always "Near Center" style (expanded)
                                        zoom={viewState.zoom}
                                    />
                                </motion.div>
                            )}
                        </Marker>
                    ))}
                </AnimatePresence>

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
                        {/* Only show marker if it's NOT the selected one (expanding) */}
                        {selectedMessage?.id !== msg.id && (
                            <motion.div
                                layoutId={`message-container-${msg.id}`}
                                className={`cursor-pointer transition-transform duration-300 hover:scale-150 ${selectedFriend ? 'blur-sm opacity-50' : ''}`}
                            >
                                <div className="w-2 h-2 rounded-full border border-white shadow-md bg-indigo-500" />
                            </motion.div>
                        )}
                    </Marker>
                ))}

                {/* Message Details Overlay - Expanded from Bubble AS A MARKER */}
                <AnimatePresence>
                    {selectedMessage && (
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
                            />
                        </Marker>
                    )}
                </AnimatePresence>
            </Map>


            {locationError && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded shadow-md z-10 text-xs">
                    Location Error: {locationError.message}
                </div>
            )}
        </div>
    );
}
