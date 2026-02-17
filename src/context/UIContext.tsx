"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { Keyboard } from '@capacitor/keyboard';

type UIState = {
    isMessageDetailsOpen: boolean;
    isLoginModalOpen: boolean;
    isKeyboardOpen: boolean;
    triggerLocationFocus: number;
    triggerFocusLocation: () => void;
};

type UIContextType = UIState & {
    setMessageDetailsOpen: (isOpen: boolean) => void;
    setLoginModalOpen: (isOpen: boolean) => void;
    triggerLocationFocus: number;
    triggerFocusLocation: () => void;
};

const defaultState: UIState = {
    isMessageDetailsOpen: false,
    isLoginModalOpen: false,
    isKeyboardOpen: false,
    triggerLocationFocus: 0,
    triggerFocusLocation: () => { },
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
            // We capture the initial height. Note: On mobile, initial load might be full height.
            // Ideally we compare against window.screen.height or keep track of max height seen.
            let maxHeight = viewport.height;

            viewportHandler = () => {
                // Update max height if we find a larger one (e.g. browser bar collapse)
                if (viewport.height > maxHeight) maxHeight = viewport.height;

                const isKeyboardVisible = (maxHeight - viewport.height) > 150;

                setState(prev => {
                    // Only update if state actually changes to avoid re-renders
                    if (prev.isKeyboardOpen !== isKeyboardVisible) {
                        // If closing keyboard via viewport detection, also scroll to top
                        if (!isKeyboardVisible && prev.isKeyboardOpen) {
                            // window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
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

    const contextValue = useMemo(() => ({
        ...state,
        setMessageDetailsOpen,
        setLoginModalOpen,
        triggerLocationFocus,
        triggerFocusLocation
    }), [state, setMessageDetailsOpen, setLoginModalOpen, triggerLocationFocus, triggerFocusLocation]);

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
