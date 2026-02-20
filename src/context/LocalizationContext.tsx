"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '@/lib/translations';

interface LocalizationContextType {
    lang: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

const getSystemLanguage = (): Language => {
    if (typeof window === 'undefined') return 'en';

    const browserLang = navigator.language.toLowerCase();

    if (browserLang.startsWith('tr')) return 'tr';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('de')) return 'de';
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('ru')) return 'ru';
    if (browserLang.startsWith('zh')) {
        if (browserLang.includes('tw') || browserLang.includes('hk') || browserLang.includes('mo') || browserLang.includes('hant')) {
            return 'zh-Hant';
        }
        return 'zh-Hans';
    }
    if (browserLang.startsWith('ar')) return 'ar';

    return 'en';
};

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<Language>('en'); // Default initial to avoid SSR mismatch
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const savedLang = localStorage.getItem('geogram_lang') as Language;
        if (savedLang && translations[savedLang]) {
            setLang(savedLang);
        } else {
            setLang(getSystemLanguage());
        }
        setIsInitialized(true);
    }, []);

    const setLanguage = (newLang: Language) => {
        setLang(newLang);
        localStorage.setItem('geogram_lang', newLang);
        // Force the page to handle RTL for Arabic
        if (typeof document !== 'undefined') {
            document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
        }
    };

    const t = (key: TranslationKey): string => {
        const trans = (translations as any)[lang] || translations.en;
        return (trans as any)[key] || (translations.en as any)[key] || key;
    };

    // Apply RTL on initial load if needed
    useEffect(() => {
        if (isInitialized && typeof document !== 'undefined') {
            document.dir = lang === 'ar' ? 'rtl' : 'ltr';
        }
    }, [isInitialized, lang]);

    return (
        <LocalizationContext.Provider value={{ lang, setLanguage, t }}>
            {children}
        </LocalizationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LocalizationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LocalizationProvider');
    }
    return context;
};
