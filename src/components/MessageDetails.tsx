import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import VoteControls from "./VoteControls";
import { customMapStyle } from "@/lib/mapboxStyle"; // Import Style
import Map from "react-map-gl/mapbox"; // Import Map
import { Capacitor, registerPlugin } from "@capacitor/core";
import { useTranslation } from "@/context/LocalizationContext";

// InstagramStories plugin registration removed in favor of SocialSharing
import { toPng } from "html-to-image";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { X, Heart, MessageCircle, Share2, ThumbsUp, ThumbsDown, Check, UserPlus, Clock, Share as ShareIcon, Shield, Send, Crown, Instagram, MoreHorizontal, MoreVertical, Flag, Ban, Trash2 } from "lucide-react";
import { BADGE_CONFIGS } from "@/lib/badgeConfig";
import { m, AnimatePresence } from "framer-motion";
import { memo } from "react";
import { Message, Comment } from "@/lib/store";
import BadgeEarnedModal from "./BadgeEarnedModal";

// Consolidating icons to avoid conflicts
const Icons = {
    Instagram: Instagram,
    WhatsApp: MessageCircle, // Use MessageCircle as placeholder or custom SVG
    More: MoreHorizontal,
    Share: ShareIcon,
    Close: X
};

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
    onDelete?: (id: string) => Promise<{ success: boolean }>;
}

const MessageDetails = memo(({
    message,
    layoutId,
    onClose,
    onVote,
    onAddFriend,
    getFriendStatus,
    currentUser,
    unlimitedVotes,
    locationName,
    onDelete
}: MessageDetailsProps) => {
    const { t } = useTranslation();
    const router = useRouter();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // currentUser passed from Map.tsx is a NextAuth session object: { user: { id, name, email } }
    const currentUserId = currentUser?.user?.id ?? currentUser?.id;
    const isOwner = !!(currentUserId && message.userId && currentUserId === message.userId);


    const handleDelete = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            // Auto-cancel after 3s
            setTimeout(() => setConfirmDelete(false), 3000);
            return;
        }
        if (!onDelete || isDeleting) return;
        setIsDeleting(true);
        const result = await onDelete(message.id);
        if (result.success) {
            onClose();
        } else {
            setIsDeleting(false);
            setConfirmDelete(false);
        }
    };

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
                const data = await response.json();
                // Comment API now returns { ...comment, userUpdates: { earnedBadges } }
                const comment = data.userUpdates ? data : data; // Fallback if structure varies

                if (data.userUpdates?.earnedBadges?.length > 0) {
                    setEarnedBadges(data.userUpdates.earnedBadges);
                }

                // Add to list
                setComments(prev => [...prev, data]);
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
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Initial Share Click -> Open Menu AND Start Generating
    const handleShareClick = () => {
        if (!Capacitor.isNativePlatform()) {
            handleShareAction('system');
            return;
        }

        setShowShareMenu(true);
        // Start generating immediately if not already done
        if (!generatedImage && !isGenerating) {
            generateShareImage();
        }
    };

    const generateShareImage = async (): Promise<string | null> => {
        if (generatedImage) return generatedImage;
        setIsGenerating(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Small UI yield

            // Allow map to settle if needed, but since we start early, this is less blocking for the user
            await new Promise(resolve => setTimeout(resolve, 500));

            const shareElement = document.getElementById(`share-card-${message.id}`);
            if (!shareElement) {
                console.error("Share element not found");
                return null;
            }

            const dataUrl = await toPng(shareElement, {
                quality: 0.95,
                pixelRatio: 2,
                filter: (node) => true,
            });

            setGeneratedImage(dataUrl);
            return dataUrl;
        } catch (error) {
            console.error("Error generating image:", error);
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShareAction = async (platform: 'instagram' | 'whatsapp' | 'system') => {
        if (isSharing) return;
        setIsSharing(true);

        try {
            // Get Image: Reuse pre-generated or generate now
            let dataUrl = generatedImage;
            if (!dataUrl) {
                console.log("Image not ready, generating now...");
                dataUrl = await generateShareImage();
            }

            if (!dataUrl) {
                alert("Failed to generate image. Please try again.");
                return;
            }

            // 2. Platform Specific Handling
            if (Capacitor.isNativePlatform()) {
                const ss = (window as any).plugins?.socialsharing;

                if (platform === 'instagram') {
                    if (ss) {
                        ss.shareViaInstagram(
                            null, // message
                            dataUrl, // image
                            () => console.log("Instagram share success"),
                            (err: any) => {
                                console.error("Instagram share error:", err);
                                genericShare(dataUrl!);
                            }
                        );
                    } else {
                        // Fallback to deep link if possible or system share
                        genericShare(dataUrl);
                    }
                } else if (platform === 'whatsapp') {
                    if (ss) {
                        ss.shareViaWhatsApp(
                            null, // message
                            dataUrl, // image
                            null, // link
                            () => console.log("WhatsApp share success"),
                            (err: any) => {
                                console.error("WhatsApp share error:", err);
                                genericShare(dataUrl!);
                            }
                        );
                    } else {
                        genericShare(dataUrl);
                    }
                } else {
                    // System / Fallback
                    await genericShare(dataUrl);
                }
            } else {
                // Web Share
                await genericShare(dataUrl);
            }

        } catch (error) {
            console.error("Error sharing:", error);
        } finally {
            setIsSharing(false);
        }
    };

    const genericShare = async (dataUrl: string) => {
        try {
            if (Capacitor.isNativePlatform()) {
                // Native generic share
                const fileName = `share-${Date.now()}.png`;
                const file = await Filesystem.writeFile({
                    path: fileName,
                    data: dataUrl,
                    directory: Directory.Cache
                });

                await Share.share({
                    files: [file.uri],
                });
            } else {
                // Web Share
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], "share.png", { type: blob.type });
                const shareData = {
                    files: [file],
                    title: t('share_post_title'),
                    text: t('share_post_text').replace('{name}', message.userName),
                };

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share(shareData);
                } else {
                    // Fallback to download
                    const link = document.createElement('a');
                    link.download = 'share.png';
                    link.href = dataUrl;
                    link.click();
                }
            }
        } catch (err) {
            console.error("Generic share failed", err);
        } finally {
            setIsSharing(false);
        }
    };

    // Static Map URL for background
    const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${message.lng},${message.lat},15,0/600x1200?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&logo=false&attribution=false`;


    return (
        <m.div
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
                paddingBottom: "20px" // Use padding so the element include the space for the pointer
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
                                <div className={`w-10 h-10 rounded-full p-[2px] ${isFriend ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gradient-to-br from-purple-500 to-indigo-500'}`}>
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
                                {message.activeBadgeId && BADGE_CONFIGS[message.activeBadgeId] && (
                                    <div
                                        title={t(BADGE_CONFIGS[message.activeBadgeId].nameKey)}
                                        className={`absolute -top-1 -right-1 z-20 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br ${BADGE_CONFIGS[message.activeBadgeId].style} text-xs shadow-sm transform rotate-12 ring-1 ring-white/20`}
                                    >
                                        {BADGE_CONFIGS[message.activeBadgeId].icon}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <h3 className="text-white font-bold text-base leading-tight truncate group-hover/user:text-purple-300 transition-colors">
                                        {message.userName}
                                    </h3>
                                </div>
                                <p className="text-white/40 text-[10px] font-medium truncate">
                                    {message.isAnonymous ? t('anonymous_user') : t('view_profile_action')}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons - properly aligned */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Share Button (New) */}
                            <button
                                onClick={handleShareClick}
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

                            {/* Delete Button - owner only */}
                            {isOwner && onDelete && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                    disabled={isDeleting}
                                    className={`p-2 rounded-xl transition-all border disabled:opacity-50 ${confirmDelete
                                        ? 'bg-red-500/30 text-red-400 border-red-500/50 animate-pulse'
                                        : 'bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border-white/5'
                                        }`}
                                    title={confirmDelete ? t('confirm_delete') || 'Sil?' : t('delete_post') || 'Sil'}
                                >
                                    {isDeleting
                                        ? <div className="w-4 h-4 rounded-full border-2 border-red-400 border-t-transparent animate-spin" />
                                        : <Trash2 size={16} />}
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
                                <span>{formatRelativeTime(message.timestamp)} {t('ago')}</span>
                            </div>
                            {locationName && (
                                <div className="text-[10px] text-purple-300/60 font-medium truncate max-w-[120px]">
                                    {locationName}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-2 mt-3 border-t border-white/10 pt-3 pointer-events-auto">
                        <h4 className="text-white/60 text-[10px] font-semibold uppercase tracking-wider">{t('comments_count')} ({comments.length})</h4>

                        {/* Comments List */}
                        <div
                            className="space-y-1.5 max-h-32 overflow-y-auto pointer-events-auto"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <style jsx>{`
                                div::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>
                            {isLoadingComments ? (
                                <div className="text-white/40 text-[10px] text-center py-2">{t('loading_comments')}</div>
                            ) : comments.length === 0 ? (
                                <div className="text-white/40 text-[10px] text-center py-2">{t('no_comments_yet')}</div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="bg-white/5 rounded-lg p-2 border border-white/5">
                                        <div className="flex items-center gap-2">
                                            {comment.authorImage ? (
                                                <img
                                                    src={comment.authorImage}
                                                    alt={comment.authorName}
                                                    className="w-5 h-5 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                    {comment.authorName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 text-[12px] leading-snug break-all">
                                                <span className="font-bold text-white mr-2">{comment.authorName}</span>
                                                <span className="text-white/90">{comment.content}</span>
                                                <span className="text-white/30 text-[10px] ml-2 inline-block">
                                                    {formatRelativeTime(new Date(comment.createdAt).getTime())}
                                                </span>
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
                                className="flex gap-2 pointer-events-auto mt-2" // Reduced margin
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
                                        e.currentTarget.focus();
                                    }}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    placeholder={t('write_comment')}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-purple-500/50 pointer-events-auto cursor-text select-text z-50"
                                    style={{ pointerEvents: 'auto' }}
                                    disabled={isSubmitting}
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="p-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg transition-all disabled:cursor-not-allowed pointer-events-auto flex items-center justify-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Send size={14} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>
            </div>

            {/* Map Pointer/Triangle */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '0', // Align to bottom of the padded container
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '20px solid transparent',
                    borderRight: '20px solid transparent',
                    borderTopWidth: '20px',
                    borderTopStyle: 'solid',
                    borderTopColor: isFriend ? '#051a0d' : '#120024',
                    filter: isFriend
                        ? 'drop-shadow(0 4px 4px rgba(34,197,94,0.1))'
                        : 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))',
                    zIndex: -1
                }}
            />

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
                                zoom: 10.5 // Zoomed out ~2x (from 12.5) as requested
                            }}
                            mapStyle={customMapStyle as any}
                            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                            attributionControl={false}
                            preserveDrawingBuffer={true} // Essential for html-to-image capture
                            style={{ width: '100%', height: '100%' }}
                            interactive={false}
                        />
                    </div>

                    {/* Central Content - The Bubble (Correctly Positioned) */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -100%)', // Anchors bottom-center (tail tip) to map center
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
                                transformOrigin: 'bottom center',
                                paddingBottom: '0px' // Ensure no extra padding at bottom
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

            {/* Custom Share Menu Bottom Sheet */}
            {
                showShareMenu && typeof document !== 'undefined' && createPortal(
                    <AnimatePresence mode="wait">
                        <m.div
                            key="backdrop"
                            className="fixed inset-0 z-[2147483647] bg-black/60 pointer-events-auto"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setShowShareMenu(false);
                                setGeneratedImage(null);
                                setIsGenerating(false);
                            }}
                        />
                        <m.div
                            key="sheet"
                            className="fixed bottom-0 left-0 right-0 z-[2147483647] pointer-events-none flex justify-center"
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <div
                                className="relative w-full max-w-md bg-[#1a0033] rounded-t-3xl p-6 pb-10 ring-1 ring-white/20 shadow-2xl animate-in slide-in-from-bottom duration-200 pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-col gap-4">
                                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2" />
                                    <h3 className="text-white text-center font-bold mb-2">{t('share_to')}</h3>

                                    <div className="grid grid-cols-4 gap-4 justify-items-center">
                                        {/* Instagram Option */}
                                        <button
                                            onClick={() => handleShareAction('instagram')}
                                            className="flex flex-col items-center gap-2 group w-full"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                                                <Icons.Instagram className="w-7 h-7 text-white" />
                                            </div>
                                            <span className="text-xs text-white/80">{t('stories')}</span>
                                        </button>

                                        {/* WhatsApp Option */}
                                        <button
                                            onClick={() => handleShareAction('whatsapp')}
                                            className="flex flex-col items-center gap-2 group w-full"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                                                <Icons.WhatsApp className="w-7 h-7 text-white" />
                                            </div>
                                            <span className="text-xs text-white/80">WhatsApp</span>
                                        </button>

                                        {/* System Option */}
                                        <button
                                            onClick={() => handleShareAction('system')}
                                            className="flex flex-col items-center gap-2 group w-full"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                                                <Icons.More className="w-7 h-7 text-white" />
                                            </div>
                                            <span className="text-xs text-white/80">{t('more')}</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setShowShareMenu(false)}
                                        className="mt-4 w-full py-3 bg-white/5 rounded-xl text-white font-medium hover:bg-white/10 active:scale-[0.98] transition-all"
                                    >
                                        {t('cancel')}
                                    </button>
                                </div>
                            </div>
                        </m.div>
                    </AnimatePresence>,
                    document.body
                )
            }

            {/* Badge Celebration Overlay */}
            {
                earnedBadges.length > 0 && (
                    <BadgeEarnedModal
                        badgeId={earnedBadges[0]}
                        onClose={() => setEarnedBadges(prev => prev.slice(1))}
                    />
                )
            }
        </m.div>
    );
});

MessageDetails.displayName = 'MessageDetails';
export default MessageDetails;
