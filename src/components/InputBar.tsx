"use client";

import { Send, MapPin, Globe, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useLocation } from "@/hooks/useLocation";
import { useSession, signIn } from "next-auth/react";
import { useConfig } from "@/context/ConfigContext";
import { useUI } from "@/context/UIContext";

// Slot machine text animation component
function SignInPrompt() {
    const { setLoginModalOpen } = useUI();
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
        }}>
            {/* Liquid glass button */}
            <button
                onClick={() => setLoginModalOpen(true)}
                style={{
                    position: 'relative',
                    padding: '16px 40px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '9999px',
                    fontSize: '18px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: 'glow-pulse 3s ease-in-out infinite',
                    overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
            >
                <span style={{ position: 'relative', zIndex: 10 }}>
                    Sign In & Start Posting
                </span>
            </button>

            {/* Animations */}
            <style>{`
                @keyframes glow-pulse {
                    0%, 100% {
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 
                                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                                    0 0 15px rgba(255, 255, 255, 0.3);
                    }
                    50% {
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 
                                    inset 0 1px 0 rgba(255, 255, 255, 0.2),
                                    0 0 25px rgba(255, 255, 255, 0.5);
                    }
                }
            `}</style>
        </div>
    );
}

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
    const { isMessageDetailsOpen, setLoginModalOpen, isKeyboardOpen } = useUI();

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
        // We expect sendMessage to return an object { success: boolean, error?: string, isPremiumCallback?: boolean }
        const result = await sendMessage(message, location.lat, location.lng, visibility);

        // Check for Premium Limit Error (Limit Reached)
        if (result && !result.success && result.isPremiumCallback) {
            // Basic Alert for now - later can be a modal
            // Using window.confirm to allow quick navigation
            if (confirm(result.error || "Daily post limit reached! Upgrade to Premium for unlimited posts.")) {
                window.location.href = '/settings'; // Force navigation
            }
        } else if (result && !result.success) {
            alert(result.error || "Failed to post message");
        } else {
            // Success
            setMessage("");
        }

        setIsSending(false);
    };

    if (isMessageDetailsOpen) return null;

    return (
        <>
            {/* Location indicator - above input bar */}
            {location && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: isKeyboardOpen ? '80px' : '230px', // Adjust position when keyboard is open
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#e0aaff',
                        fontSize: '14px',
                        fontWeight: 500,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        zIndex: 60,
                        pointerEvents: 'none'
                    }}
                >
                    <MapPin size={14} style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                    <span>Location detected</span>
                </div>
            )}

            <div
                style={{
                    position: 'fixed', // Changed to fixed to stick to viewport relative
                    bottom: isKeyboardOpen ? '0' : '110px',
                    left: 0,
                    right: 0,
                    padding: isKeyboardOpen ? '10px 12px' : '0 12px',
                    paddingBottom: isKeyboardOpen ? 'calc(10px + env(safe-area-inset-bottom))' : '0', // Handle safe area
                    pointerEvents: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 50,
                    transition: 'bottom 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' // smooth transition
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
                        boxSizing: 'border-box', // Ensure padding doesn't cause overflow
                    }}
                >


                    {/* Input form */}
                    {!session ? (
                        <SignInPrompt />
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px',
                                background: visibility === 'public'
                                    ? 'rgba(20, 0, 50, 0.4)'
                                    : 'rgba(0, 80, 40, 0.6)', // Stronger Green for friends
                                backdropFilter: 'blur(20px) saturate(180%)',
                                borderRadius: '9999px', // Fully oval
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                                border: visibility === 'public'
                                    ? '1px solid rgba(255, 255, 255, 0.1)'
                                    : '1px solid rgba(74, 222, 128, 0.3)', // Slight green border
                                transition: 'all 0.3s ease-out',
                                ...(isFocused && {
                                    background: visibility === 'public'
                                        ? 'rgba(30, 0, 70, 0.5)'
                                        : 'rgba(5, 100, 50, 0.7)',
                                    boxShadow: visibility === 'public'
                                        ? '0 0 0 1px rgba(157, 78, 221, 0.5), 0 8px 32px 0 rgba(31, 38, 135, 0.5)'
                                        : '0 0 0 1px rgba(74, 222, 128, 0.6), 0 8px 32px 0 rgba(6, 78, 59, 0.5)',
                                }),
                                ...(!location && { opacity: 0.6 })
                            }}
                        >
                            {/* Toggle Button */}
                            <div className="relative flex bg-black/30 rounded-full p-1 border border-white/5 ml-1 shrink-0">
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

                            <div className="flex-1 relative group">
                                <div className={`absolute inset-0 bg-white/10 rounded-full blur-xl transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
                                <div
                                    className={`relative flex items-center w-full bg-[#1a0033]/80 backdrop-blur-xl border transition-all duration-300 rounded-full overflow-hidden ${isFocused
                                        ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                        : 'border-white/10 shadow-lg'
                                        }`}
                                >
                                    {/* Typewriter text overlay - Absolute positioned to not affect input layout */}
                                    {(!message && !isFocused && location) && (
                                        <div className="absolute inset-0 flex items-center pl-4 pointer-events-none">
                                            <span className="text-white/50 text-sm font-medium tracking-wide">
                                                {placeholder}
                                                <span className="animate-pulse text-purple-400">|</span>
                                            </span>
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        placeholder={location ? "" : "Waiting for location..."}
                                        disabled={!location}
                                        maxLength={maxChars}
                                        style={{
                                            flex: 1,
                                            width: 0, // CRITICAL: Forces flex-basis to 0, allowing flex-grow to work properly
                                            minWidth: 0, // CRITICAL: Prevents flex item from overflowing container
                                            padding: '10px 14px',
                                            background: 'transparent',
                                            border: 'none',
                                            outline: 'none',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                            ...((!location || !message.trim()) && { opacity: 0.9 }),
                                            cursor: !location ? 'not-allowed' : 'text'
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!message.trim() || isSending || !location || message.length > maxChars}
                                style={{
                                    padding: '12px',
                                    borderRadius: '9999px',
                                    flexShrink: 0, // CRITICAL: Prevent button from shrinking or overflowing
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

                    {/* Character count - only when signed in */}
                    {session && (
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
                    )}
                </div>
            </div>
        </>
    );
}
