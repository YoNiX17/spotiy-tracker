'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { UserStats } from '@/lib/pocketbase';
import TopTracksWithPreview from './TopTracksWithPreview';

interface StatsCardProps {
    className?: string;
}

interface HistoryTrack {
    trackId: string;
    trackName: string;
    artistName: string;
    albumImage: string;
    playCount: number;
    totalDuration: number;
}

interface HistoryArtist {
    artistName: string;
    artistImage?: string;
    playCount: number;
    totalDuration: number;
}

interface StatsData {
    user: {
        id: string;
        displayName: string;
        profileImage: string | null;
    };
    stats: UserStats | null;
    topTracksFromHistory: HistoryTrack[];
    topArtistsFromHistory: HistoryArtist[];
}

type TimePeriod = 'today' | 'week' | 'month' | 'year' | '2025' | '2024' | '2023' | 'all';

// Format time in minutes only
function formatMinutes(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    return `${minutes.toLocaleString()} min`;
}

export default function StatsCard({ className = '' }: StatsCardProps) {
    const [data, setData] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/stats?period=${timePeriod}`);
                if (res.ok) {
                    const statsData = await res.json();
                    setData(statsData);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [timePeriod]);

    if (loading) {
        return (
            <div className={`glass-panel rounded-2xl p-6 ${className}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card rounded-xl p-4">
                            <div className="skeleton h-8 w-16 mb-2"></div>
                            <div className="skeleton h-4 w-24"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data || !data.stats) {
        return (
            <div className={`glass-panel rounded-2xl p-6 ${className}`}>
                <div className="text-center py-8">
                    <i className="fa-solid fa-chart-bar text-4xl text-[#1db954]/30 mb-4"></i>
                    <p className="text-gray-400">Pas encore de statistiques</p>
                    <p className="text-sm text-gray-500">Écoute de la musique pour commencer à tracker !</p>
                </div>
            </div>
        );
    }

    const { stats, topTracksFromHistory, topArtistsFromHistory, user } = data;

    return (
        <div className={className}>
            {/* User Profile */}
            <div className="glass-panel rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4">
                    {user.profileImage ? (
                        <Image
                            src={user.profileImage}
                            alt={user.displayName}
                            width={64}
                            height={64}
                            className="artist-image"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-[#1db954]/20 flex items-center justify-center">
                            <i className="fa-solid fa-user text-2xl text-[#1db954]"></i>
                        </div>
                    )}
                    <div>
                        <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-white">
                            {user.displayName}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            <i className="fa-brands fa-spotify mr-2"></i>
                            Connecté
                        </p>
                    </div>
                    <a
                        href="/api/auth/logout"
                        className="ml-auto text-gray-500 hover:text-red-400 transition-colors"
                    >
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </a>
                </div>
            </div>

            {/* Time Period Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[
                    { key: 'today', label: "Aujourd'hui" },
                    { key: 'week', label: '7 jours' },
                    { key: 'month', label: '30 jours' },
                    { key: 'year', label: '2026' },
                    { key: '2025', label: '2025' },
                    { key: '2024', label: '2024' },
                    { key: '2023', label: '2023' },
                    { key: 'all', label: 'Tout' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTimePeriod(key as TimePeriod)}
                        className={`time-tab text-xs ${timePeriod === key ? 'active' : ''}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="stat-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-[#1db954]">
                        {formatMinutes(stats.totalListeningTime)}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                        Temps d'écoute
                    </div>
                </div>
                <div className="stat-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                        {stats.totalTracks.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                        Écoutes
                    </div>
                </div>
                <div className="stat-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                        {stats.uniqueTracks.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                        Titres uniques
                    </div>
                </div>
                <div className="stat-card rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">
                        {stats.uniqueArtists.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                        Artistes
                    </div>
                </div>
            </div>

            {/* Top from History */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Most played tracks with audio preview */}
                <TopTracksWithPreview tracks={topTracksFromHistory} />

                {/* Top artists - with images */}
                {topArtistsFromHistory.length > 0 && (
                    <div className="glass-panel rounded-2xl p-6">
                        <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold text-white mb-4">
                            <i className="fa-solid fa-heart text-red-500 mr-2"></i>
                            Artistes favoris
                        </h3>
                        <div className="space-y-3">
                            {topArtistsFromHistory.slice(0, 5).map((artist, index) => (
                                <div key={artist.artistName} className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-500 w-4">{index + 1}</span>
                                    {artist.artistImage ? (
                                        <Image
                                            src={artist.artistImage}
                                            alt={artist.artistName}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-[#1db954]/30"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1db954]/30 to-[#1ed760]/20 flex items-center justify-center">
                                            <i className="fa-solid fa-user text-[#1db954]"></i>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-white truncate">{artist.artistName}</h4>
                                        <p className="text-xs text-gray-400">{formatMinutes(artist.totalDuration)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-[#1db954]">{artist.playCount}x</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
