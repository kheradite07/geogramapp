"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMessages } from "@/hooks/useMessages";
import { useUser } from "@/hooks/useUser";
import { useUI } from "@/context/UIContext";
import { useTranslation } from "@/context/LocalizationContext";
import { MapPin, MessageSquare, Heart } from "lucide-react";
import { useMemo } from "react";

export default function ActivePosts() {
    const { t } = useTranslation();
    const { messages } = useMessages();
    const { user } = useUser();
    const { setFocusedLocation, isKeyboardOpen } = useUI();

    const activeUserPosts = useMemo(() => {
        if (!user || !messages) return [];
        const filtered = messages.filter(msg => msg.userId === user.id);
        console.log("[ActivePosts] User ID:", user.id, "Filtered posts:", filtered.length);
        return filtered;
    }, [messages, user]);

    // Hide if not logged in
    if (!user) return null;

    // Hide if keyboard is open to save space
    if (isKeyboardOpen) return null;

    return (
        <div style={{
            width: '100%',
            marginBottom: '10px',
            padding: '0 4px',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                paddingLeft: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
                <MapPin size={12} className="text-purple-400" />
                {t('my_active_posts') || 'Aktif Postlarım'}
            </div>

            <div
                className="hide-scrollbar"
                style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '4px 12px 10px 12px',
                    overflowX: 'auto',
                    scrollSnapType: 'x proximity',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                <AnimatePresence mode="popLayout">
                    {activeUserPosts.length === 0 ? (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            color: 'rgba(255, 255, 255, 0.3)',
                            fontSize: '13px',
                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                            width: '100%'
                        }}>
                            Henüz aktif bir paylaşımın yok
                        </div>
                    ) : activeUserPosts.map((post) => (
                        <motion.button
                            key={post.id}
                            initial={{ scale: 0.8, opacity: 0, x: -20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFocusedLocation({ lat: post.lat, lng: post.lng, zoom: 16 })}
                            style={{
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 14px',
                                background: post.visibility === 'friends'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(123, 44, 191, 0.15)',
                                backdropFilter: 'blur(16px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                                borderRadius: '20px',
                                border: `1px solid ${post.visibility === 'friends' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(123, 44, 191, 0.3)'}`,
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                scrollSnapAlign: 'start'
                            }}
                        >
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: post.visibility === 'friends'
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                    : 'linear-gradient(135deg, #7b2cbf 0%, #3c096c 100%)',
                                color: 'white',
                                flexShrink: 0
                            }}>
                                <MessageSquare size={14} className="m-auto" />
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                maxWidth: '140px'
                            }}>
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '100%',
                                    textAlign: 'left'
                                }}>
                                    {post.text}
                                </span>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '2px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px' }}>
                                        <Heart size={10} className={post.likes > 0 ? 'text-pink-500 fill-pink-500' : ''} />
                                        <span>{post.likes}</span>
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
                                        {formatTime(post.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}

function formatTime(timestamp: number) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
