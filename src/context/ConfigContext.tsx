"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ConfigState = {
    expirationHours: number;
    minLikesForZoom: number;
    maxChars: number;
    isSimulationMode: boolean;
    unlimitedVotes: boolean;
    clusterRadius: number; // Base radius for clustering (in degrees)
};

type ConfigContextType = ConfigState & {
    updateConfig: (key: keyof ConfigState, value: number | boolean) => void;
};

const defaultConfig: ConfigState = {
    expirationHours: 24,
    minLikesForZoom: 5,
    maxChars: 50,
    isSimulationMode: false,
    unlimitedVotes: false,
    clusterRadius: 0.009, // ~900m at zoom 12
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<ConfigState>(defaultConfig);

    const updateConfig = (key: keyof ConfigState, value: number | boolean) => {
        setConfig((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <ConfigContext.Provider value={{ ...config, updateConfig }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
}
