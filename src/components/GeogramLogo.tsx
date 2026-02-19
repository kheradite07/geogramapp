import React from 'react';

interface GeogramLogoProps {
    className?: string;
    size?: number;
    withText?: boolean;
}

export default function GeogramLogo({ className = "", size = 48, withText = false }: GeogramLogoProps) {
    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2e1065" /> {/* Violet-950 (Deep Dark Purple) */}
                        <stop offset="100%" stopColor="#7e22ce" /> {/* Purple-700 (Vibrant Purple) */}
                    </linearGradient>
                    <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" /> {/* White */}
                        <stop offset="100%" stopColor="#d8b4fe" /> {/* Purple-300 (Bright Lavender) */}
                    </linearGradient>
                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.3" />
                    </filter>
                </defs>

                {/* Background Squircle */}
                <rect x="5" y="5" width="90" height="90" rx="28" fill="url(#logoGradient)" />

                {/* Location Pin Icon - Centered Vertically with Shadow */}
                <g transform="translate(0, -5)" filter="url(#dropShadow)">
                    <path
                        d="M50 25C37.5 25 27.5 35 27.5 47.5C27.5 64.5 50 87.5 50 87.5C50 87.5 72.5 64.5 72.5 47.5C72.5 35 62.5 25 50 25ZM50 55C45.9 55 42.5 51.6 42.5 47.5C42.5 43.4 45.9 40 50 40C54.1 40 57.5 43.4 57.5 47.5C57.5 51.6 54.1 55 50 55Z"
                        fill="url(#pinGradient)"
                    />
                </g>
            </svg>

            {withText && (
                <h1 className="mt-3 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-300 tracking-tight lowercase" style={{ fontFamily: 'sans-serif' }}>
                    geogram
                </h1>
            )}
        </div>
    );
}
