'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'spotify' | 'red-empire' | 'purple' | 'blue' | 'orange';

interface ThemeConfig {
    name: string;
    primary: string;
    primaryHover: string;
    primaryRgb: string;
    icon: string;
}

export const THEMES: Record<Theme, ThemeConfig> = {
    spotify: {
        name: 'Spotify',
        primary: '#1db954',
        primaryHover: '#1ed760',
        primaryRgb: '29, 185, 84',
        icon: 'fa-brands fa-spotify',
    },
    'red-empire': {
        name: 'Red Empire',
        primary: '#ff3333',
        primaryHover: '#ff5555',
        primaryRgb: '255, 51, 51',
        icon: 'fa-solid fa-crown',
    },
    purple: {
        name: 'Purple',
        primary: '#8b5cf6',
        primaryHover: '#a78bfa',
        primaryRgb: '139, 92, 246',
        icon: 'fa-solid fa-wand-magic-sparkles',
    },
    blue: {
        name: 'Ocean',
        primary: '#3b82f6',
        primaryHover: '#60a5fa',
        primaryRgb: '59, 130, 246',
        icon: 'fa-solid fa-water',
    },
    orange: {
        name: 'Sunset',
        primary: '#f97316',
        primaryHover: '#fb923c',
        primaryRgb: '249, 115, 22',
        icon: 'fa-solid fa-sun',
    },
};

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>('spotify');
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('spotify-tracker-theme') as Theme;
        if (saved && THEMES[saved]) {
            setTheme(saved);
        }
    }, []);

    // Apply theme colors to CSS variables
    useEffect(() => {
        if (!mounted) return;

        const config = THEMES[theme];
        localStorage.setItem('spotify-tracker-theme', theme);

        // Update CSS custom properties on document root
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', config.primary);
        root.style.setProperty('--theme-primary-hover', config.primaryHover);
        root.style.setProperty('--theme-primary-rgb', config.primaryRgb);

        // Also update body background gradient
        document.body.style.backgroundImage = `
            radial-gradient(ellipse at 20% 0%, rgba(${config.primaryRgb}, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(${config.primaryRgb}, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(10, 20, 15, 1) 0%, #030303 100%)
        `;
    }, [theme, mounted]);

    const config = THEMES[theme];

    return (
        <ThemeContext.Provider value={{ theme, setTheme, config }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
