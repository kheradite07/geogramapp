"use client";

import { motion } from "framer-motion";
import { Message, Comment } from "@/lib/store";
import { Check, Clock, UserPlus, X, Send, Share as ShareIcon } from "lucide-react";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { toPng } from "html-to-image";
import { Capacitor } from "@capacitor/core";
import Map from "react-map-gl/mapbox"; // Import Map
import { customMapStyle } from "@/lib/mapboxStyle"; // Import Style
import VoteControls from "./VoteControls";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MessageDetailsProps {
    message: Message;
    layoutId: string;
    onClose: () => void;
    onVote: (id: string, action: 'like' | 'dislike', unlimited: boolean) => void;
    onAddFriend: (id: string) => void;
    getFriendStatus: (id: string) => string;
    currentUser: any;
    unlimitedVotes: boolean;
    locationName?: string | null;
}

export default function MessageDetails({
    message,
    layoutId,
    onClose,
    onVote,
    onAddFriend,
    getFriendStatus,
    currentUser,
    unlimitedVotes,
    locationName
}: MessageDetailsProps) {
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFriend = getFriendStatus(message.userId) === 'friend';

    // Fetch comments
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await fetch(`/api/messages/${message.id}/comments`);
                if (response.ok) {
                    const data = await response.json();
                    setComments(data);
                }
            } catch (error) {
                console.error("Error fetching comments:", error);
            } finally {
                setIsLoadingComments(false);
            }
        };
        fetchComments();
    }, [message.id]);

    // Submit comment
    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/messages/${message.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment.trim() })
            });

            if (response.ok) {
                const comment = await response.json();
                setComments(prev => [...prev, comment]);
                setNewComment("");
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };


    // Share Functionality
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSharing) return;
        setIsSharing(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Small yield

            const shareElement = document.getElementById(`share-card-${message.id}`);
            if (!shareElement) {
                console.error("Share element not found");
                return;
            }

            // Wait a bit for map to ensure tiles are ready (since we switched to real Map component)
            // In a production app, we might check map 'idle' event, but a delay helps here.
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Generate Image
            const dataUrl = await toPng(shareElement, {
                quality: 0.95,
                pixelRatio: 2,
                // Ensure we capture WebGL content (the Map)
                filter: (node) => true,
            });

            // 3. Share based on Platform
            if (Capacitor.isNativePlatform()) {
                // Native: Write to file system first
                const fileName = `geogram-share-${Date.now()}.png`;
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: dataUrl,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: 'Check out this post on Geogram!',
                    text: `"${message.text}" - ${message.userName}`,
                    url: savedFile.uri,
                    dialogTitle: 'Share to Instagram Stories'
                });
            } else {
                // Web Fallback (Navigator Share or Download)
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], "geogram-share.png", { type: "image/png" });

                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Geogram Post',
                        text: message.text
                    });
                } else {
                    // Download fallback
                    const link = document.createElement('a');
                    link.download = 'geogram-share.png';
                    link.href = dataUrl;
                    link.click();
                }
            }

        } catch (error) {
            console.error("Sharing failed:", error);
        } finally {
            setIsSharing(false);
        }
    };

    // Static Map URL for background
    const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${message.lng},${message.lat},15,0/600x1200?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&logo=false&attribution=false`;


    return (
        <motion.div
            className="w-[85vw] max-w-[320px] md:w-80 pointer-events-auto"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
                duration: 0.2,
                ease: "easeOut"
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
                transformOrigin: "bottom center",
                marginBottom: "10px"
            }}
        >
            <div className={`backdrop-blur-3xl border rounded-[1.5rem] p-3 md:p-5 overflow-hidden relative group transition-colors duration-300 ${isFriend
                ? 'bg-[#051a0d]/95 border-green-500/40 shadow-[0_8px_32px_rgba(34,197,94,0.2)]'
                : 'bg-[#120024]/95 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                }`}>
                {/* Content Container */}
                <div className="space-y-4">
                    {/* Header: User Info with integrated close button */}
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center gap-3 cursor-pointer group/user flex-1 min-w-0"
                            onClick={() => message.userId && router.push(`/profile?id=${message.userId}`)}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-purple-500 to-indigo-500">
                                    <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                        {message.userImage ? (
                                            <img
                                                src={message.userImage}
                                                alt={message.userName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black text-white font-bold text-xs">
                                                {message.userName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-base leading-tight truncate group-hover/user:text-purple-300 transition-colors">
                                    {message.userName}
                                </h3>
                                <p className="text-white/40 text-[10px] font-medium truncate">
                                    {message.isAnonymous ? "Anonymous User" : "View Profile"}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons - properly aligned */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Share Button (New) */}
                            <button
                                onClick={handleShare}
                                disabled={isSharing}
                                className="p-2 bg-purple-600/20 hover:bg-purple-600/40 rounded-xl text-purple-300 transition-all border border-purple-500/30 disabled:opacity-50"
                            >
                                {isSharing ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-purple-300 border-t-transparent animate-spin" />
                                ) : (
                                    <ShareIcon size={16} />
                                )}
                            </button>

                            {/* Add Friend Button */}
                            {currentUser && !message.isAnonymous && getFriendStatus(message.userId) !== 'self' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAddFriend(message.userId);
                                    }}
                                    disabled={getFriendStatus(message.userId) !== 'none'}
                                    className={`p-2 rounded-xl transition-all shadow-lg ${getFriendStatus(message.userId) === 'friend' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        getFriendStatus(message.userId) === 'sent' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                            'bg-purple-600 text-white hover:bg-purple-500 hover:scale-105 hover:shadow-purple-500/25'
                                        }`}
                                >
                                    {getFriendStatus(message.userId) === 'friend' ? <Check size={16} /> :
                                        getFriendStatus(message.userId) === 'sent' ? <Clock size={16} /> :
                                            <UserPlus size={16} />}
                                </button>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all border border-white/5"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-white text-sm leading-relaxed font-medium">
                            "{message.text}"
                        </p>
                    </div>

                    {/* Voting & Meta */}
                    <div className="flex items-center justify-between pt-2">
                        <VoteControls
                            message={message}
                            onVote={onVote}
                            currentUser={currentUser}
                            unlimitedVotes={unlimitedVotes}
                            orientation="horizontal"
                        />

                        <div className="text-right space-y-0.5">
                            <div className="flex items-center justify-end text-xs text-white/40 gap-1.5">
                                <span>{formatRelativeTime(message.timestamp)} ago</span>
                            </div>
                            {locationName && (
                                <div className="text-[10px] text-purple-300/60 font-medium truncate max-w-[120px]">
                                    {locationName}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-3 mt-4 border-t border-white/10 pt-4 pointer-events-auto">
                        <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Comments ({comments.length})</h4>

                        {/* Comments List */}
                        <div
                            className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pointer-events-auto"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            {isLoadingComments ? (
                                <div className="text-white/40 text-xs text-center py-4">Loading comments...</div>
                            ) : comments.length === 0 ? (
                                <div className="text-white/40 text-xs text-center py-4">No comments yet. Be the first!</div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <div className="flex items-start gap-2">
                                            {comment.authorImage ? (
                                                <img
                                                    src={comment.authorImage}
                                                    alt={comment.authorName}
                                                    className="w-6 h-6 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {comment.authorName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white/80 text-xs font-semibold">{comment.authorName}</span>
                                                    <span className="text-white/30 text-[10px]">{formatRelativeTime(new Date(comment.createdAt).getTime())} ago</span>
                                                </div>
                                                <p className="text-white/90 text-sm mt-1 leading-relaxed">{comment.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        {currentUser && (
                            <form
                                onSubmit={handleSubmitComment}
                                className="flex gap-2 pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        (e.target as HTMLInputElement).focus();
                                    }}
                                    placeholder="Write a comment..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-base text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 pointer-events-auto cursor-text"
                                    style={{ pointerEvents: 'auto' }}
                                    disabled={isSubmitting}
                                    autoComplete="off"
                                    tabIndex={0}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl transition-all disabled:cursor-not-allowed pointer-events-auto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>
            </div>

            {/* Hidden Share Card Template */}
            <div className="absolute -z-50 top-0 left-0 overflow-hidden pointer-events-none opacity-0" aria-hidden="true">
                <div
                    id={`share-card-${message.id}`}
                    className="w-[360px] h-[640px] relative bg-[#1a0033] flex flex-col overflow-hidden text-white"
                >
                    {/* Background Map - Real Mapbox Style */}
                    <div className="absolute inset-0 z-0">
                        <Map
                            initialViewState={{
                                longitude: message.lng,
                                latitude: message.lat,
                                zoom: 12.5 // Slightly zoomed out as requested
                            }}
                            mapStyle={customMapStyle as any}
                            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                            attributionControl={false}
                            preserveDrawingBuffer={true} // Essential for html-to-image capture
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
                                filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))', // Standard shadow from Map.tsx
                                transform: 'scale(1)', // No extra scaling
                                transformOrigin: 'center center'
                            }}
                        >
                            {/* Chat bubble */}
                            <div
                                style={{
                                    position: 'relative',
                                    maxWidth: '240px', // Exact match
                                    padding: '8px 12px 8px 8px', // Exact match
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
                                            {message.userName} • {formatRelativeTime(message.timestamp)}
                                        </span>
                                    </div>
                                </div>

                                {/* Vote Pills (Attached exactly like screenshot) */}
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

                        </div>
                    </div>

                    {/* Download CTA */}
                    <div className="absolute bottom-12 w-full text-center z-20">
                        <div className="inline-block px-6 py-3 bg-white text-black rounded-full font-bold text-sm shadow-xl animate-bounce">
                            📍 Join me on Geogram
                        </div>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
