'use client';

import { useEffect, useState } from 'react';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    iconColor: string;
    bgColor: string;
    unlocked: boolean;
    progress: number;
    target: number;
    category: 'listening' | 'streak' | 'discovery' | 'special';
}

const ACHIEVEMENTS_CONFIG = [
    // Listening achievements
    { id: 'first_steps', name: 'Premiers Pas', description: '10 écoutes', icon: 'fa-shoe-prints', target: 10, category: 'listening', iconColor: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { id: 'music_lover', name: 'Mélomane', description: '100 écoutes', icon: 'fa-heart', target: 100, category: 'listening', iconColor: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    { id: 'addict', name: 'Accro', description: '500 écoutes', icon: 'fa-bolt', target: 500, category: 'listening', iconColor: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    { id: 'marathoner', name: 'Marathonien', description: '1000 écoutes', icon: 'fa-person-running', target: 1000, category: 'listening', iconColor: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { id: 'legend', name: 'Légende', description: '5000 écoutes', icon: 'fa-crown', target: 5000, category: 'listening', iconColor: 'text-amber-400', bgColor: 'bg-amber-500/20' },

    // Time achievements
    { id: 'hour_1', name: 'Première Heure', description: '1h d\'écoute', icon: 'fa-clock', target: 3600000, category: 'listening', iconColor: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    { id: 'hour_10', name: 'Dix Heures', description: '10h d\'écoute', icon: 'fa-hourglass-half', target: 36000000, category: 'listening', iconColor: 'text-teal-400', bgColor: 'bg-teal-500/20' },
    { id: 'hour_100', name: 'Centurion', description: '100h d\'écoute', icon: 'fa-hourglass', target: 360000000, category: 'listening', iconColor: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },

    // Streak achievements
    { id: 'streak_3', name: 'Régulier', description: '3 jours de streak', icon: 'fa-fire', target: 3, category: 'streak', iconColor: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { id: 'streak_7', name: 'Semainier', description: '7 jours de streak', icon: 'fa-fire-flame-curved', target: 7, category: 'streak', iconColor: 'text-orange-500', bgColor: 'bg-orange-600/20' },
    { id: 'streak_14', name: 'Dévoué', description: '14 jours de streak', icon: 'fa-fire-flame-simple', target: 14, category: 'streak', iconColor: 'text-red-400', bgColor: 'bg-red-500/20' },
    { id: 'streak_30', name: 'Inarrêtable', description: '30 jours de streak', icon: 'fa-meteor', target: 30, category: 'streak', iconColor: 'text-red-500', bgColor: 'bg-red-600/20' },

    // Discovery achievements
    { id: 'artists_10', name: 'Curieux', description: '10 artistes différents', icon: 'fa-users', target: 10, category: 'discovery', iconColor: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { id: 'artists_50', name: 'Explorateur', description: '50 artistes différents', icon: 'fa-compass', target: 50, category: 'discovery', iconColor: 'text-violet-400', bgColor: 'bg-violet-500/20' },
    { id: 'artists_100', name: 'Globe-Trotter', description: '100 artistes différents', icon: 'fa-earth-americas', target: 100, category: 'discovery', iconColor: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },

    // Special achievements
    { id: 'night_owl', name: 'Noctambule', description: 'Écoute après minuit', icon: 'fa-moon', target: 1, category: 'special', iconColor: 'text-blue-300', bgColor: 'bg-blue-400/20' },
    { id: 'early_bird', name: 'Lève-tôt', description: 'Écoute avant 6h', icon: 'fa-sun', target: 1, category: 'special', iconColor: 'text-yellow-300', bgColor: 'bg-yellow-400/20' },
];

export default function Achievements({ className = '' }: { className?: string }) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        const fetchAchievements = async () => {
            try {
                const res = await fetch('/api/achievements');
                if (res.ok) {
                    const data = await res.json();
                    setAchievements(data.achievements);
                }
            } catch (error) {
                console.error('Error fetching achievements:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAchievements();
    }, []);

    if (loading) {
        return (
            <div className={`glass-panel rounded-2xl p-6 ${className}`}>
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton h-24 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const categories = [
        { id: 'all', label: 'Tous', icon: 'fa-trophy' },
        { id: 'listening', label: 'Écoute', icon: 'fa-headphones' },
        { id: 'streak', label: 'Streak', icon: 'fa-fire' },
        { id: 'discovery', label: 'Découverte', icon: 'fa-compass' },
        { id: 'special', label: 'Spécial', icon: 'fa-star' },
    ];

    const filteredAchievements = selectedCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className={`glass-panel rounded-2xl p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                        <i className="fa-solid fa-trophy text-yellow-500"></i>
                        Achievements
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {unlockedCount}/{achievements.length} débloqués
                    </p>
                </div>

                {/* Progress ring */}
                <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                        <circle
                            cx="32" cy="32" r="28" fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="4"
                            strokeDasharray={`${(unlockedCount / achievements.length) * 175.9} 175.9`}
                            strokeLinecap="round"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#1db954" />
                                <stop offset="100%" stopColor="#1ed760" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                        {Math.round((unlockedCount / achievements.length) * 100)}%
                    </span>
                </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`time-tab whitespace-nowrap flex items-center gap-2 ${selectedCategory === cat.id ? 'active' : ''}`}
                    >
                        <i className={`fa-solid ${cat.icon} text-xs`}></i>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Achievements grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredAchievements.map(achievement => (
                    <div
                        key={achievement.id}
                        className={`relative rounded-xl p-4 text-center transition-all ${achievement.unlocked
                                ? `${achievement.bgColor} border border-white/10`
                                : 'bg-gray-900/50 border border-gray-800'
                            } ${achievement.unlocked ? 'hover:scale-105' : 'opacity-50'}`}
                    >
                        {/* Icon */}
                        <div className={`text-3xl mb-2 ${achievement.unlocked ? achievement.iconColor : 'text-gray-600'}`}>
                            <i className={`fa-solid ${achievement.icon}`}></i>
                        </div>

                        {/* Name */}
                        <h4 className={`text-sm font-bold ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                            {achievement.name}
                        </h4>

                        {/* Description */}
                        <p className="text-xs text-gray-500 mt-1">
                            {achievement.description}
                        </p>

                        {/* Progress bar for locked achievements */}
                        {!achievement.unlocked && achievement.progress > 0 && (
                            <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-spotify-500 rounded-full"
                                    style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                                ></div>
                            </div>
                        )}

                        {/* Unlocked badge */}
                        {achievement.unlocked && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-spotify-500 rounded-full flex items-center justify-center">
                                <i className="fa-solid fa-check text-white text-xs"></i>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
