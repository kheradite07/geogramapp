"use client";

import { useConfig } from "@/context/ConfigContext";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";

export default function DebugPanel() {
    const { expirationHours, minLikesForZoom, maxChars, isSimulationMode, unlimitedVotes, clusterRadius, updateConfig } = useConfig();
    const { user, mutate } = useUser();
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-[9999] bg-black/80 text-white p-2 rounded shadow-lg text-xs font-mono hover:bg-black"
            >
                DEBUG
            </button>
        );
    }

    return (
        <div className="fixed top-4 left-4 z-[9999] bg-black/80 backdrop-blur-md text-white p-4 rounded-lg shadow-xl w-64 border border-white/10 font-mono text-sm">
            <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-2">
                <h3 className="font-bold text-yellow-400">Debug Panel</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white"
                >
                    ×
                </button>
            </div>

            <div className="space-y-4">
                {/* Simulation Mode Toggle */}
                <div className="flex items-center justify-between">
                    <label className="block text-gray-400 text-xs">
                        Simulation Mode (Click Map)
                    </label>
                    <button
                        onClick={() => updateConfig('isSimulationMode', !isSimulationMode)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isSimulationMode ? 'bg-green-500' : 'bg-gray-600'}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${isSimulationMode ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {/* Unlimited Votes Toggle */}
                <div className="flex items-center justify-between">
                    <label className="block text-gray-400 text-xs text-yellow-500/80">
                        Unlimited Votes (Debug)
                    </label>
                    <button
                        onClick={() => updateConfig('unlimitedVotes', !unlimitedVotes)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${unlimitedVotes ? 'bg-yellow-500' : 'bg-gray-600'}`}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${unlimitedVotes ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                {/* Expiration */}
                <div>
                    <label className="block text-gray-400 text-xs mb-1">
                        Msg Expiration: <span className="text-white">{expirationHours}h</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="72"
                        value={expirationHours}
                        onChange={(e) => updateConfig('expirationHours', Number(e.target.value))}
                        className="w-full accent-yellow-400"
                    />
                </div>

                {/* Zoom Filter */}
                <div>
                    <label className="block text-gray-400 text-xs mb-1">
                        Min Likes (Zoom Out): <span className="text-white">{minLikesForZoom}</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        value={minLikesForZoom}
                        onChange={(e) => updateConfig('minLikesForZoom', Number(e.target.value))}
                        className="w-full accent-yellow-400"
                    />
                </div>

                {/* Character Limit */}
                <div>
                    <label className="block text-gray-400 text-xs mb-1">
                        Max Characters: <span className="text-white">{maxChars}</span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="140"
                        value={maxChars}
                        onChange={(e) => updateConfig('maxChars', Number(e.target.value))}
                        className="w-full accent-yellow-400"
                    />
                </div>

                {/* Cluster Radius */}
                <div>
                    <label className="block text-gray-400 text-xs mb-1">
                        Cluster Radius: <span className="text-white">{clusterRadius.toFixed(3)}</span>
                    </label>
                    <input
                        type="range"
                        min="0.001"
                        max="0.02"
                        step="0.001"
                        value={clusterRadius}
                        onChange={(e) => updateConfig('clusterRadius', parseFloat(e.target.value))}
                        className="w-full accent-yellow-400"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                        Higher = more clustering
                    </span>
                </div>

                {/* Clear All Messages */}
                <div className="pt-2 border-t border-red-500/20">
                    <button
                        onClick={async () => {
                            if (window.confirm('Are you sure you want to delete all messages?')) {
                                try {
                                    const response = await fetch('/api/messages/clear', {
                                        method: 'DELETE',
                                    });
                                    if (response.ok) {
                                        window.location.reload();
                                    }
                                } catch (error) {
                                    console.error('Failed to clear messages:', error);
                                }
                            }
                        }}
                        className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-400 text-sm font-medium transition-colors"
                    >
                        🗑️ Clear All Messages
                    </button>
                </div>
                {/* User Debug Controls */}
                <div className="pt-2 border-t border-white/20 space-y-3">
                    <h4 className="text-yellow-400 font-bold text-xs uppercase">User Debug</h4>

                    {/* Premium User Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="block text-gray-400 text-xs">
                            Is Premium User
                        </label>
                        <button
                            onClick={async () => {
                                try {
                                    // Toggle current state (optimistic)
                                    const newState = !user?.isPremium;
                                    await fetch('/api/debug/user', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'setPremium', value: newState })
                                    });
                                    mutate(); // Refresh user data
                                } catch (e) {
                                    console.error('Failed to toggle premium', e);
                                }
                            }}
                            className={`w-10 h-5 rounded-full relative transition-colors ${user?.isPremium ? 'bg-yellow-500' : 'bg-gray-600'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${user?.isPremium ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    {/* Reset Daily Limit */}
                    <button
                        onClick={async () => {
                            if (window.confirm('Reset daily post limit for today?')) {
                                try {
                                    const res = await fetch('/api/debug/user', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'resetDailyLimit' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        alert(`Limit reset! Moved ${data.moved} posts to yesterday.`);
                                        window.location.reload(); // Reload to refresh limit checks
                                    }
                                } catch (e) {
                                    console.error('Failed to reset limit', e);
                                }
                            }
                        }}
                        className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-blue-400 text-sm font-medium transition-colors"
                    >
                        🔄 Reset Daily Limit
                    </button>

                    {/* Reset Level */}
                    <button
                        onClick={async () => {
                            if (window.confirm('Reset level to 1 and XP to 0?')) {
                                try {
                                    const res = await fetch('/api/debug/user', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'resetLevel' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        alert(`Level reset! Now at Level ${data.level} with ${data.xp} XP.`);
                                        mutate(); // Refresh user data
                                    }
                                } catch (e) {
                                    console.error('Failed to reset level', e);
                                }
                            }
                        }}
                        className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded text-purple-400 text-sm font-medium transition-colors"
                    >
                        ⭐ Reset Level
                    </button>
                </div>
            </div>
        </div>
    );
}
