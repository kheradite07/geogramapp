"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Keyboard } from '@capacitor/keyboard';

type UIState = {
    isMessageDetailsOpen: boolean;
    isLoginModalOpen: boolean;
    isKeyboardOpen: boolean;
    triggerLocationFocus: number;
    triggerFocusLocation: () => void;
    focusedLocation: { lat: number; lng: number; zoom?: number } | null;
};

type UIContextType = UIState & {
    setMessageDetailsOpen: (isOpen: boolean) => void;
    setLoginModalOpen: (isOpen: boolean) => void;
    setFocusedLocation: (location: { lat: number; lng: number; zoom?: number } | null) => void;
};

const defaultState: UIState = {
    isMessageDetailsOpen: false,
    isLoginModalOpen: false,
    isKeyboardOpen: false,
    triggerLocationFocus: 0,
    triggerFocusLocation: () => { },
    focusedLocation: null,
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<UIState>(defaultState);

    const setMessageDetailsOpen = useCallback((isOpen: boolean) => {
        setState(prev => {
            if (prev.isMessageDetailsOpen === isOpen) return prev;
            return { ...prev, isMessageDetailsOpen: isOpen };
        });
    }, []);

    const setLoginModalOpen = useCallback((isOpen: boolean) => {
        setState(prev => {
            if (prev.isLoginModalOpen === isOpen) return prev;
            return { ...prev, isLoginModalOpen: isOpen };
        });
    }, []);

    useEffect(() => {
        let showListener: any;
        let hideListener: any;
        let viewportHandler: any;

        const setupListeners = async () => {
            // Capacitor Keyboard Plugin
            try {
                showListener = await Keyboard.addListener('keyboardWillShow', () => {
                    setState(prev => ({ ...prev, isKeyboardOpen: true }));
                });
                hideListener = await Keyboard.addListener('keyboardWillHide', () => {
                    setState(prev => ({ ...prev, isKeyboardOpen: false }));
                });
            } catch (e) {
                // console.warn("Keyboard plugin not available");
            }
        };

        // Visual Viewport API
        if (typeof window !== 'undefined' && window.visualViewport) {
            const viewport = window.visualViewport;
            let maxHeight = viewport.height;

            viewportHandler = () => {
                if (viewport.height > maxHeight) maxHeight = viewport.height;
                const isKeyboardVisible = (maxHeight - viewport.height) > 150;

                setState(prev => {
                    if (prev.isKeyboardOpen !== isKeyboardVisible) {
                        return { ...prev, isKeyboardOpen: isKeyboardVisible };
                    }
                    return prev;
                });
            };
            viewport.addEventListener('resize', viewportHandler);
        }

        setupListeners();

        return () => {
            if (showListener) showListener.remove();
            if (hideListener) hideListener.remove();
            if (viewportHandler && window.visualViewport) {
                window.visualViewport.removeEventListener('resize', viewportHandler);
            }
        };
    }, []);

    const [triggerLocationFocus, setTriggerLocationFocus] = useState<number>(0);

    const triggerFocusLocation = useCallback(() => {
        setTriggerLocationFocus(Date.now());
    }, []);

    const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

    const contextValue = useMemo(() => ({
        ...state,
        setMessageDetailsOpen,
        setLoginModalOpen,
        triggerLocationFocus,
        triggerFocusLocation,
        focusedLocation,
        setFocusedLocation
    }), [state, setMessageDetailsOpen, setLoginModalOpen, triggerLocationFocus, triggerFocusLocation, focusedLocation]);

    return (
        <UIContext.Provider value={contextValue}>
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
