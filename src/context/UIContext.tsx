"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type UIState = {
    isMessageDetailsOpen: boolean;
    isLoginModalOpen: boolean;
};

type UIContextType = UIState & {
    setMessageDetailsOpen: (isOpen: boolean) => void;
    setLoginModalOpen: (isOpen: boolean) => void;
};

const defaultState: UIState = {
    isMessageDetailsOpen: false,
    isLoginModalOpen: false,
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<UIState>(defaultState);

    const setMessageDetailsOpen = (isOpen: boolean) => {
        setState(prev => ({ ...prev, isMessageDetailsOpen: isOpen }));
    };

    const setLoginModalOpen = (isOpen: boolean) => {
        setState(prev => ({ ...prev, isLoginModalOpen: isOpen }));
    };

    return (
        <UIContext.Provider value={{ ...state, setMessageDetailsOpen, setLoginModalOpen }}>
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
