"use client";

import { useState, useEffect } from 'react';
import { themes } from '@/components/themes/themes';
import { GameTheme } from '@/components/types/types';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<GameTheme>(themes.default);

  useEffect(() => {
    const savedTheme = localStorage.getItem('bingoTheme');
    if (savedTheme) {
      setCurrentTheme(JSON.parse(savedTheme));
    }

    const handleStorageChange = () => {
      const updatedTheme = localStorage.getItem('bingoTheme');
      if (updatedTheme) {
        setCurrentTheme(JSON.parse(updatedTheme));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className={`theme-${currentTheme}`}>
      {children}
    </div>
  );
}