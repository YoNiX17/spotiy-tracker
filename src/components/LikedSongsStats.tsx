'use client';

import { useEffect, useState } from 'react';

interface LikedSongsData {
    total: number;
    recentlyAdded: number;
    oldestDate: string | null;
}

export default function LikedSongsStats({ className = '' }: { className?: string }) {
    const [stats, setStats] = useState<LikedSongsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLikedSongs = async () => {
            try {
                const res = await fetch('/api/liked-songs');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching liked songs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLikedSongs();
    }, []);

    if (loading) {
        return (
            <div className={`glass-panel rounded-2xl p-4 ${className}`}>
                <div className="skeleton h-16 w-full rounded-lg"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className={`glass-panel rounded-2xl p-4 ${className}`}>
                <div className="text-center text-gray-500 text-sm py-4">
                    Impossible de charger les titres likés
                </div>
            </div>
        );
    }

    return (
        <div className={`glass-panel rounded-2xl p-4 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                    💚 Titres Likés
                </h3>
                <i className="fa-solid fa-heart text-[var(--theme-primary,#1db954)]"></i>
            </div>

            <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                    {stats.total.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                    titres dans ta bibliothèque
                </div>
            </div>

            {stats.recentlyAdded > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5 text-center">
                    <span className="text-xs text-[var(--theme-primary,#1db954)]">
                        +{stats.recentlyAdded} cette semaine
                    </span>
                </div>
            )}
        </div>
    );
}
