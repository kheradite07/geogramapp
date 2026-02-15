"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';

type UIState = {
    isMessageDetailsOpen: boolean;
    isLoginModalOpen: boolean;
    isKeyboardOpen: boolean;
};

type UIContextType = UIState & {
    setMessageDetailsOpen: (isOpen: boolean) => void;
    setLoginModalOpen: (isOpen: boolean) => void;
};

const defaultState: UIState = {
    isMessageDetailsOpen: false,
    isLoginModalOpen: false,
    isKeyboardOpen: false,
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

    useEffect(() => {
        // Keyboard listeners for mobile adjustment
        let showListener: any;
        let hideListener: any;

        const setupListeners = async () => {
            // We can check if platform is native if needed, but listeners are safe to call
            showListener = await Keyboard.addListener('keyboardWillShow', () => {
                setState(prev => ({ ...prev, isKeyboardOpen: true }));
            });

            hideListener = await Keyboard.addListener('keyboardWillHide', () => {
                setState(prev => ({ ...prev, isKeyboardOpen: false }));
            });
        };

        setupListeners();

        return () => {
            if (showListener) showListener.remove();
            if (hideListener) hideListener.remove();
        };
    }, []);

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
