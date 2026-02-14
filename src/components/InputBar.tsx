"use client";

import { Send, MapPin, Globe, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useLocation } from "@/hooks/useLocation";
import { useSession, signIn } from "next-auth/react";
import { useConfig } from "@/context/ConfigContext";
import { useUI } from "@/context/UIContext";

const PLACEHOLDER_PHRASES = [
    "Hava nasıl?",
    "Trafik durumu nasıl?",
    "Yakınlarda en son gelişmeler nelerdir?",
    "En iyi kahve nerede?",
    "Bu akşam ne yapsam?",
    "Manzara harika!",
    "Konser var mı?",
    "Acil durum var mı?",
    "Spor yapmak için partner aranıyor.",
    "Ders çalışacak kütüphane?"
];

export default function InputBar() {
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { sendMessage } = useMessages();
    const { location } = useLocation();
    const { data: session } = useSession();

    const { maxChars } = useConfig();
    const { isMessageDetailsOpen } = useUI();

    // Typewriter Effect State
    const [placeholder, setPlaceholder] = useState("");
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    // Visibility State
    const [visibility, setVisibility] = useState<'public' | 'friends'>('public');

    useEffect(() => {
        if (!location) return;

        const currentPhrase = PLACEHOLDER_PHRASES[phraseIndex];

        let typingSpeed = 100;
        if (isDeleting) typingSpeed = 50;

        const handleTyping = () => {
            if (!isDeleting && charIndex < currentPhrase.length) {
                // Typing
                setPlaceholder(currentPhrase.substring(0, charIndex + 1));
                setCharIndex(prev => prev + 1);
            } else if (!isDeleting && charIndex === currentPhrase.length) {
                // Finished typing, pause before deleting
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && charIndex > 0) {
                // Deleting
                setPlaceholder(currentPhrase.substring(0, charIndex - 1));
                setCharIndex(prev => prev - 1);
            } else if (isDeleting && charIndex === 0) {
                // Finished deleting, move to next phrase
                setIsDeleting(false);
                setPhraseIndex(prev => (prev + 1) % PLACEHOLDER_PHRASES.length);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, phraseIndex, location]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isSending || !location || message.length > maxChars) return;

        setIsSending(true);
        // Pass visibility to sendMessage (requires update in hook/API)
        // For now, we will just send it as part of the message if the hook allows or we update hook later
        await sendMessage(message, location.lat, location.lng, visibility);
        setIsSending(false);
        setMessage("");
    };

    if (isMessageDetailsOpen) return null;

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '110px', // Moved up to avoid bottom menu overlap
                left: 0,
                right: 0,
                padding: '0 24px',
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
                    maxWidth: '48rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isMessageDetailsOpen ? 'translateY(20px) scale(0.95)' : 'translateY(0) scale(1)',
                    opacity: isMessageDetailsOpen ? 0 : 1,
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
                            fontWeight: 500,
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
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
                                background: 'rgba(60, 9, 108, 0.6)',
                                color: 'white',
                                border: '1px solid rgba(157, 78, 221, 0.3)',
                                borderRadius: '9999px',
                                fontSize: '16px',
                                fontWeight: 600,
                                backdropFilter: 'blur(12px)',
                                cursor: 'pointer',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
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
                            gap: '8px',
                            padding: '6px',
                            background: 'rgba(20, 0, 50, 0.4)', // More transparent for liquid glass
                            backdropFilter: 'blur(20px) saturate(180%)',
                            borderRadius: '9999px', // Fully oval
                            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease-out',
                            ...(isFocused && {
                                background: 'rgba(30, 0, 70, 0.5)',
                                boxShadow: '0 0 0 1px rgba(157, 78, 221, 0.5), 0 8px 32px 0 rgba(31, 38, 135, 0.5)',
                            }),
                            ...(!location && { opacity: 0.6 })
                        }}
                    >
                        {/* Toggle Button */}
                        <div className="relative flex bg-black/30 rounded-full p-1 border border-white/5 ml-1">
                            <div
                                className={`absolute inset-y-1 w-1/2 rounded-full transition-all duration-300 ${visibility === 'public' ? 'left-1 bg-purple-600' : 'left-[calc(50%)] bg-green-500'}`}
                                style={{ width: 'calc(50% - 4px)' }}
                            />
                            <button
                                type="button"
                                onClick={() => setVisibility('public')}
                                className={`relative z-10 p-2 rounded-full transition-colors ${visibility === 'public' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                                title="Public"
                            >
                                <Globe size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setVisibility('friends')}
                                className={`relative z-10 p-2 rounded-full transition-colors ${visibility === 'friends' ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
                                title="Friends Only"
                            >
                                <Users size={18} />
                            </button>
                        </div>

                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            placeholder={location ? `${placeholder}|` : "Waiting for location..."}
                            disabled={!location}
                            maxLength={maxChars}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 500,
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                ...((!location || !message.trim()) && { opacity: 0.9 }),
                                cursor: !location ? 'not-allowed' : 'text'
                            }}
                        />

                        <button
                            type="submit"
                            disabled={!message.trim() || isSending || !location || message.length > maxChars}
                            style={{
                                padding: '12px',
                                borderRadius: '9999px',
                                background: visibility === 'public'
                                    ? 'linear-gradient(135deg, #7b2cbf 0%, #3c096c 100%)'
                                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green for friends
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.2)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s',
                                cursor: !message.trim() || isSending || !location || message.length > maxChars ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '4px',
                                ...(((!message.trim() || isSending || !location || message.length > maxChars)) && {
                                    background: 'rgba(255,255,255,0.1)',
                                    opacity: 0.5,
                                    boxShadow: 'none',
                                    border: 'none'
                                })
                            }}
                            onMouseEnter={(e) => {
                                if (message.trim() && location && !isSending && message.length <= maxChars) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
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
                <div style={{
                    textAlign: 'right',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: message.length > maxChars ? 'rgba(255, 99, 99, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 500,
                    marginRight: '16px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                    {message.length} / {maxChars} characters
                </div>
            </div>
        </div>
    );
}
