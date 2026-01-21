'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formatDuration } from '@/lib/spotify';
import { ListeningEntry } from '@/lib/pocketbase';

interface RecentHistoryProps {
    className?: string;
}

export default function RecentHistory({ className = '' }: RecentHistoryProps) {
    const [history, setHistory] = useState<ListeningEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/stats');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.recentHistory || []);
                }
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return (
            <div className={`glass-panel rounded-2xl p-6 ${className}`}>
                <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-white mb-6">
                    <i className="fa-solid fa-clock-rotate-left text-[#1db954] mr-3"></i>
                    Historique
                </h2>
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3">
                            <div className="skeleton w-12 h-12 rounded-lg"></div>
                            <div className="flex-1">
                                <div className="skeleton h-4 w-48 mb-2"></div>
                                <div className="skeleton h-3 w-32"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className={`glass-panel rounded-2xl p-6 ${className}`}>
                <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-white mb-6">
                    <i className="fa-solid fa-clock-rotate-left text-[#1db954] mr-3"></i>
                    Historique
                </h2>
                <div className="text-center py-8">
                    <i className="fa-solid fa-history text-4xl text-[#1db954]/30 mb-4"></i>
                    <p className="text-gray-400">Pas encore d'historique</p>
                    <p className="text-sm text-gray-500">Ton historique sera enregistré au fur et à mesure</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`glass-panel rounded-2xl p-6 ${className}`}>
            <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-white mb-6">
                <i className="fa-solid fa-clock-rotate-left text-[#1db954] mr-3"></i>
                Historique récent
                <span className="text-sm text-gray-500 font-normal ml-2">({history.length} écoutes)</span>
            </h2>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {history.map((entry, index) => (
                    <a
                        key={`${entry.trackId}-${entry.played_at}-${index}`}
                        href={entry.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="track-card flex items-center gap-4 p-3 rounded-xl"
                    >
                        <Image
                            src={entry.albumImage || '/placeholder.png'}
                            alt={entry.albumName}
                            width={48}
                            height={48}
                            className="album-art"
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{entry.trackName}</h4>
                            <p className="text-sm text-gray-400 truncate">{entry.artistName}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-xs text-gray-500 font-mono">
                                {formatDuration(entry.duration_ms)}
                            </div>
                            <div className="text-xs text-gray-600">
                                {formatTimeAgo(entry.played_at)}
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
