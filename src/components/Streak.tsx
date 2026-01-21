'use client';

import { useEffect, useState } from 'react';

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastListenDate: string;
}

export default function Streak({ className = '' }: { className?: string }) {
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStreak = async () => {
            try {
                const res = await fetch('/api/streak');
                if (res.ok) {
                    const data = await res.json();
                    setStreak(data);
                }
            } catch (error) {
                console.error('Error fetching streak:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStreak();
    }, []);

    if (loading) {
        return (
            <div className={`glass-panel rounded-2xl p-4 ${className}`}>
                <div className="skeleton h-12 w-full rounded-lg"></div>
            </div>
        );
    }

    const currentStreak = streak?.currentStreak || 0;
    const longestStreak = streak?.longestStreak || 0;

    return (
        <div className={`glass-panel rounded-2xl p-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
                        🔥 Streak
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${currentStreak > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                            {currentStreak}
                        </span>
                        <span className="text-gray-400 text-xs">
                            {currentStreak === 1 ? 'jour' : 'jours'}
                        </span>
                    </div>
                </div>

                {/* Flame icon */}
                <div className={currentStreak >= 3 ? 'text-orange-500' : 'text-gray-600'}>
                    <i className={`fa-solid fa-fire text-2xl ${currentStreak >= 3 ? 'animate-pulse' : ''}`}></i>
                </div>
            </div>

            {/* Record */}
            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-xs">
                <span className="text-gray-500">Record</span>
                <span className="text-white font-bold">{longestStreak}j 👑</span>
            </div>
        </div>
    );
}
