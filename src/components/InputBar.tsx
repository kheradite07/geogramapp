"use client";

import { Send, MapPin } from "lucide-react";
import { useState } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useLocation } from "@/hooks/useLocation";
import { useSession, signIn } from "next-auth/react";

export default function InputBar() {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { sendMessage } = useMessages();
    const { location } = useLocation();
    const { data: session } = useSession();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isSending || !location) return;

        setIsSending(true);
        await sendMessage(message, location.lat, location.lng);
        setIsSending(false);
        setMessage("");
    };

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px',
                paddingBottom: '32px',
                pointerEvents: 'none',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 50
            }}
        >
            <div
                style={{
                    pointerEvents: 'auto',
                    width: '100%',
                    maxWidth: '48rem'
                }}
            >
                {/* Location indicator */}
                {location && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '12px',
                            color: '#e0aaff',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                    >
                        <MapPin size={14} style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                        <span>Location detected</span>
                    </div>
                )}

                {/* Input form */}
                {!session ? (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '20px'
                    }}>
                        <button
                            onClick={() => signIn()}
                            style={{
                                padding: '12px 24px',
                                background: 'rgba(60, 9, 108, 0.9)',
                                color: 'white',
                                border: '1px solid rgba(157, 78, 221, 0.5)',
                                borderRadius: '9999px',
                                fontSize: '16px',
                                fontWeight: 600,
                                backdropFilter: 'blur(10px)',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            Sign in to post
                        </button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px',
                            background: 'linear-gradient(to right, rgba(16, 0, 43, 0.95), rgba(36, 0, 70, 0.95), rgba(16, 0, 43, 0.95))',
                            backdropFilter: 'blur(16px)',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px -12px rgba(123, 44, 191, 0.2)',
                            border: '1px solid rgba(90, 24, 154, 0.5)',
                            transition: 'all 0.3s ease-out',
                            ...(isFocused && {
                                boxShadow: '0 0 0 2px rgba(157, 78, 221, 0.5), 0 25px 50px -12px rgba(157, 78, 221, 0.3)',
                                border: '1px solid rgba(123, 44, 191, 0.7)',
                                transform: 'scale(1.02)'
                            }),
                            ...(!location && { opacity: 0.6 })
                        }}
                    >
                        {/* Gradient overlay */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '16px',
                                background: 'linear-gradient(to bottom right, rgba(123, 44, 191, 0.1), transparent, rgba(60, 9, 108, 0.1))',
                                pointerEvents: 'none'
                            }}
                        />

                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={location ? "Drop your message on the map..." : "Waiting for location..."}
                            disabled={!location}
                            style={{
                                position: 'relative',
                                zIndex: 10,
                                flex: 1,
                                padding: '16px 20px',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 500,
                                ...((!location || !message.trim()) && { opacity: 0.5 }),
                                cursor: !location ? 'not-allowed' : 'text'
                            }}
                        />

                        <button
                            type="submit"
                            disabled={!message.trim() || isSending || !location}
                            style={{
                                position: 'relative',
                                zIndex: 10,
                                padding: '16px',
                                borderRadius: '12px',
                                background: 'linear-gradient(to bottom right, #7b2cbf, #5a189a)',
                                color: 'white',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgba(123, 44, 191, 0.3)',
                                transition: 'all 0.2s',
                                cursor: !message.trim() || isSending || !location ? 'not-allowed' : 'pointer',
                                ...(((!message.trim() || isSending || !location)) && {
                                    background: 'linear-gradient(to bottom right, #3c096c, #240046)',
                                    opacity: 0.5
                                })
                            }}
                            onMouseEnter={(e) => {
                                if (message.trim() && location && !isSending) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(157, 78, 221, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(123, 44, 191, 0.3)';
                            }}
                            onMouseDown={(e) => {
                                if (message.trim() && location && !isSending) {
                                    e.currentTarget.style.transform = 'scale(0.95)';
                                }
                            }}
                            onMouseUp={(e) => {
                                if (message.trim() && location && !isSending) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                        >
                            <Send
                                size={20}
                                style={{
                                    transition: 'transform 0.2s',
                                    ...(isSending && { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' })
                                }}
                            />
                        </button>
                    </form>
                )}

                {/* Character count */}
                {message.length > 50 && (
                    <div style={{
                        textAlign: 'right',
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'rgba(199, 125, 255, 0.6)',
                        fontWeight: 500
                    }}>
                        {message.length} characters
                    </div>
                )}
            </div>
        </div>
    );
}
