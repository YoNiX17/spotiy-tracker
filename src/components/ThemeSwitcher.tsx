'use client';

import { useTheme, THEMES, Theme } from '@/contexts/ThemeContext';

export default function ThemeSwitcher({ className = '' }: { className?: string }) {
    const { theme, setTheme, config } = useTheme();

    return (
        <div className={`glass-panel rounded-2xl p-6 ${className}`}>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2 mb-4">
                <i className="fa-solid fa-palette" style={{ color: config.primary }}></i>
                Thème
            </h3>

            <div className="grid grid-cols-5 gap-3">
                {(Object.keys(THEMES) as Theme[]).map((themeKey) => {
                    const themeConfig = THEMES[themeKey];
                    const isActive = theme === themeKey;

                    return (
                        <button
                            key={themeKey}
                            onClick={() => setTheme(themeKey)}
                            className={`
                                relative p-4 rounded-xl transition-all
                                ${isActive
                                    ? 'ring-2 ring-white/50 scale-105'
                                    : 'hover:scale-105 opacity-60 hover:opacity-100'
                                }
                            `}
                            style={{
                                background: `linear-gradient(135deg, ${themeConfig.primary}20, ${themeConfig.primaryHover}10)`,
                                borderColor: isActive ? themeConfig.primary : 'transparent',
                            }}
                        >
                            <div className="text-center">
                                <i
                                    className={`${themeConfig.icon} text-2xl`}
                                    style={{ color: themeConfig.primary }}
                                ></i>
                                <div className="text-xs text-white mt-2 font-medium">
                                    {themeConfig.name}
                                </div>
                            </div>

                            {isActive && (
                                <div
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                    style={{ background: themeConfig.primary }}
                                >
                                    <i className="fa-solid fa-check text-white text-xs"></i>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
                Le thème est sauvegardé automatiquement
            </p>
        </div>
    );
}
