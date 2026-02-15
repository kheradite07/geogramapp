"use client";

import { useState, useEffect } from "react";
import { Message } from "@/lib/store";

interface VoteControlsProps {
    message: Message;
    onVote?: (id: string, action: 'like' | 'dislike', unlimited: boolean) => void;
    currentUser?: any;
    unlimitedVotes?: boolean;
    orientation?: 'corner' | 'horizontal';
}

export default function VoteControls({
    message,
    onVote,
    currentUser,
    unlimitedVotes = false,
    orientation = 'corner'
}: VoteControlsProps) {
    const [optimisticLikes, setOptimisticLikes] = useState(message.likes || 0);
    const [optimisticDislikes, setOptimisticDislikes] = useState(message.dislikes || 0);

    // Track optimistic "active" state
    const userId = currentUser?.id || "anonymous";

    // helper to robustly check inclusion
    const hasUserVoted = (list: string[] | undefined, uid: string) => {
        if (!list || !Array.isArray(list)) return false;
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
        <div className="flex items-center space-x-3 pointer-events-auto" onClick={e => e.stopPropagation()}>
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
            <style jsx>{`
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
            `}</style>
        </div>
    );
};
