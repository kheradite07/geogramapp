"use client";

import Map, { Marker, NavigationControl, GeolocateControl, MapRef } from "react-map-gl/mapbox";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/hooks/useLocation";
import { useMessages } from "@/hooks/useMessages";
import { customMapStyle } from "@/lib/mapboxStyle";
import { Message } from "@/lib/store";

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

// Message Marker Component
// Premium Message Bubble Component
const MessageMarker = ({ message, onClick }: { message: Message; onClick?: () => void }) => {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer group pointer-events-auto"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))'
            }}
        >
            {/* Chat bubble */}
            <div
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
                <div className="relative z-10 w-8 h-8 shrink-0">
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
                <div className="flex flex-col relative z-10 min-w-0">
                    <span style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        lineHeight: '1.2'
                    }}>
                        {message.text}
                    </span>
                    <div className="flex items-center mt-0.5 space-x-2">
                        <span style={{
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
        </div>
    );
};

export default function MapComponent() {
    const { location, error: locationError } = useLocation();
    const { messages } = useMessages();
    const mapRef = useRef<MapRef>(null);
    const router = useRouter();

    const [viewState, setViewState] = useState({
        latitude: 41.0082,
        longitude: 28.9784,
        zoom: 12,
    });

    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [locationName, setLocationName] = useState<string | null>(null);

    // Filter messages based on zoom level and popularity
    const visibleMessages = useMemo(() => {
        return messages.filter(msg => {
            if (viewState.zoom >= 14) return true; // Show all at high zoom
            if (viewState.zoom >= 12) return (msg.likes || 0) > 0; // Show some likes at medium zoom
            return (msg.likes || 0) > 5; // Show only popular at low zoom
        });
    }, [messages, viewState.zoom]);

    // Calculate offset for nearby markers to prevent overlap
    const messagesWithOffset = useMemo(() => {
        const OVERLAP_THRESHOLD = 0.0005; // ~50m
        const OFFSET_AMOUNT = 0.0003;

        return visibleMessages.map((msg, index) => {
            let offsetX = 0;
            let offsetY = 0;

            // Check for nearby markers
            visibleMessages.slice(0, index).forEach((otherMsg) => {
                const distance = Math.sqrt(
                    Math.pow(msg.lat - otherMsg.lat, 2) +
                    Math.pow(msg.lng - otherMsg.lng, 2)
                );

                if (distance < OVERLAP_THRESHOLD) {
                    // Offset in a circular pattern
                    offsetY += OFFSET_AMOUNT;
                }
            });

            return {
                ...msg,
                displayLat: msg.lat + offsetY,
                displayLng: msg.lng + offsetX
            };
        });
    }, [visibleMessages]);

    // Handle voting
    const handleVote = async (id: string, action: 'like' | 'dislike') => {
        try {
            const response = await fetch(`/api/messages/${id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (response.ok) {
                const updatedMsg = await response.json();
                if (selectedMessage && selectedMessage.id === id) {
                    setSelectedMessage(prev => prev ? { ...prev, ...updatedMsg } : null);
                }
            }
        } catch (error) {
            console.error("Error voting:", error);
        }
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
                overflow: 'hidden'
            }}
        >
            <Map
                ref={mapRef}
                {...viewState}
                onMove={(evt: any) => setViewState(evt.viewState)}
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
                onClick={() => setSelectedMessage(null)} // Deselect on map click
            >
                {/* User Location */}
                {location && (
                    <Marker latitude={location.lat} longitude={location.lng} anchor="center">
                        <UserLocationMarker />
                    </Marker>
                )}

                {/* Messages with offset */}
                {messagesWithOffset.map((msg) => (
                    <Marker
                        key={msg.id}
                        latitude={msg.displayLat}
                        longitude={msg.displayLng}
                        anchor="bottom"
                        onClick={(e: any) => {
                            e.originalEvent.stopPropagation();
                            handleMarkerClick(msg);
                        }}
                    >
                        <MessageMarker message={msg} />
                    </Marker>
                ))}

                <GeolocateControl position="bottom-right" />
                <NavigationControl position="bottom-right" showCompass={false} />
            </Map>

            {/* Message Details Overlay */}
            {selectedMessage && (
                <div className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:top-24 md:bottom-auto md:w-96 z-50 animate-in fade-in slide-in-from-bottom-4 pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedMessage(null)}
                            className="absolute top-4 right-4 p-1 text-white/50 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* User Header */}
                        <div
                            className="flex items-center space-x-4 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => selectedMessage.userId && router.push(`/profile/${selectedMessage.userId}`)}
                        >
                            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-cyan-500">
                                {selectedMessage.userImage ? (
                                    <img
                                        src={selectedMessage.userImage}
                                        alt={selectedMessage.userName}
                                        className="w-full h-full rounded-full object-cover border-2 border-black"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center border-2 border-black font-bold text-white">
                                        {selectedMessage.userName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg leading-tight">{selectedMessage.userName}</h3>
                                <p className="text-cyan-400 text-xs font-medium">View Profile</p>
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="mb-6">
                            <p className="text-white text-lg leading-relaxed font-medium">
                                "{selectedMessage.text}"
                            </p>
                        </div>

                        {/* Meta Details */}
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            {/* Voting Controls */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => handleVote(selectedMessage.id, 'like')}
                                        className="flex items-center space-x-1 text-gray-400 hover:text-green-400 transition-colors group"
                                    >
                                        <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-green-500/20 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                            </svg>
                                        </div>
                                        <span className="font-medium">{selectedMessage.likes || 0}</span>
                                    </button>

                                    <button
                                        onClick={() => handleVote(selectedMessage.id, 'dislike')}
                                        className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors group"
                                    >
                                        <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-red-500/20 transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                            </svg>
                                        </div>
                                        <span className="font-medium">{selectedMessage.dislikes || 0}</span>
                                    </button>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {(selectedMessage.likes || 0) + (selectedMessage.dislikes || 0)} votes
                                </span>
                            </div>

                            {/* Time */}
                            <div className="flex items-center text-sm text-gray-300">
                                <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{formatRelativeTime(selectedMessage.timestamp)} ago</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-start text-sm text-gray-300">
                                <svg className="w-4 h-4 mr-2 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <p className="font-medium text-white/90">
                                        {locationName || "Locating..."}
                                    </p>
                                    <p className="text-xs text-white/50 mt-0.5">
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
