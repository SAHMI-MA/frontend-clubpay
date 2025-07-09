"use client"

import React, { createContext, ReactNode, useState, useEffect } from 'react';
import i18n from './i18n';

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: () => {}
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState('en');

  const changeLanguage = async (lang: string) => {
    console.log('Changing language to:', lang);
    
    try {
      // Update state immediately
      setLanguage(lang);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', lang);
        document.documentElement.lang = lang;
      }
      
      // Try to change i18n language if available
      if (i18n && typeof i18n.changeLanguage === 'function') {
        await i18n.changeLanguage(lang);
        console.log('Language changed successfully to:', lang);
      } else {
        console.warn('i18n instance not available, using fallback');
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  useEffect(() => {
    // Initialize language from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('i18nextLng') || 'en';
      const supportedLang = ['en', 'fr'].includes(savedLanguage) ? savedLanguage : 'en';
      
      if (supportedLang !== language) {
        setLanguage(supportedLang);
        
        // Set i18n language if available
        if (i18n && typeof i18n.changeLanguage === 'function') {
          i18n.changeLanguage(supportedLang).catch(console.error);
        }
      }
    }
  }, []); // Only run once on mount

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
