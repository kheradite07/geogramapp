"use client";

import { motion } from "framer-motion";
import { Message, Comment } from "@/lib/store";
import { Check, Clock, UserPlus, X, Send } from "lucide-react";
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
            <div className="bg-[#120024]/95 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-3 md:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group">
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
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 pointer-events-auto cursor-text"
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
        </motion.div>
    );
}
