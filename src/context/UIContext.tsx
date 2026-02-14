"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type UIState = {
    isMessageDetailsOpen: boolean;
};

type UIContextType = UIState & {
    setMessageDetailsOpen: (isOpen: boolean) => void;
};

const defaultState: UIState = {
    isMessageDetailsOpen: false,
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<UIState>(defaultState);

    const setMessageDetailsOpen = (isOpen: boolean) => {
        setState(prev => ({ ...prev, isMessageDetailsOpen: isOpen }));
    };

    return (
        <UIContext.Provider value={{ ...state, setMessageDetailsOpen }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
