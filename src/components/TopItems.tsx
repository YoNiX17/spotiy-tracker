'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formatDuration, TimeRange, getTimeRangeLabel, SpotifyTrack, SpotifyArtist } from '@/lib/spotify';

interface TopItemsProps {
    className?: string;
}

type TabType = 'tracks' | 'artists';

export default function TopItems({ className = '' }: TopItemsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('tracks');
    const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
    const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([]);
    const [topArtists, setTopArtists] = useState<SpotifyArtist[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopItems = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/top?time_range=${timeRange}`);
                if (res.ok) {
                    const data = await res.json();
                    setTopTracks(data.topTracks || []);
                    setTopArtists(data.topArtists || []);
                }
            } catch (error) {
                console.error('Error fetching top items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopItems();
    }, [timeRange]);

    const getRankBadgeClass = (rank: number) => {
        if (rank === 1) return 'rank-badge rank-1';
        if (rank === 2) return 'rank-badge rank-2';
        if (rank === 3) return 'rank-badge rank-3';
        return 'rank-badge rank-default';
    };

    return (
        <div className={`glass-panel rounded-2xl p-6 ${className}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-white">
                    <i className="fa-solid fa-trophy text-[#1db954] mr-3"></i>
                    Top {activeTab === 'tracks' ? 'Titres' : 'Artistes'}
                </h2>

                {/* Time Range Selector */}
                <div className="flex gap-2">
                    {(['short_term', 'medium_term', 'long_term'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`time-tab text-xs ${timeRange === range ? 'active' : ''}`}
                        >
                            {range === 'short_term' && '4 sem'}
                            {range === 'medium_term' && '6 mois'}
                            {range === 'long_term' && 'All time'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('tracks')}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${activeTab === 'tracks'
                            ? 'bg-[#1db954] text-white'
                            : 'bg-[#1db954]/10 text-gray-400 hover:text-white'
                        }`}
                >
                    <i className="fa-solid fa-music mr-2"></i>
                    Titres
                </button>
                <button
                    onClick={() => setActiveTab('artists')}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${activeTab === 'artists'
                            ? 'bg-[#1db954] text-white'
                            : 'bg-[#1db954]/10 text-gray-400 hover:text-white'
                        }`}
                >
                    <i className="fa-solid fa-user mr-2"></i>
                    Artistes
                </button>
            </div>

            {/* Time Range Label */}
            <p className="text-xs text-gray-500 mb-4">
                <i className="fa-regular fa-calendar mr-2"></i>
                {getTimeRangeLabel(timeRange)}
            </p>

            {/* Content */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3">
                            <div className="skeleton w-7 h-7 rounded-full"></div>
                            <div className="skeleton w-12 h-12 rounded-lg"></div>
                            <div className="flex-1">
                                <div className="skeleton h-4 w-48 mb-2"></div>
                                <div className="skeleton h-3 w-32"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : activeTab === 'tracks' ? (
                <div className="space-y-2">
                    {topTracks.slice(0, 20).map((track, index) => (
                        <a
                            key={track.id}
                            href={track.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="track-card flex items-center gap-4 p-3 rounded-xl"
                        >
                            <span className={getRankBadgeClass(index + 1)}>
                                {index + 1}
                            </span>
                            <Image
                                src={track.album.images[0]?.url || '/placeholder.png'}
                                alt={track.album.name}
                                width={48}
                                height={48}
                                className="album-art"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white truncate">{track.name}</h4>
                                <p className="text-sm text-gray-400 truncate">
                                    {track.artists.map(a => a.name).join(', ')}
                                </p>
                            </div>
                            <span className="text-xs text-gray-500 font-mono">
                                {formatDuration(track.duration_ms)}
                            </span>
                        </a>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {topArtists.slice(0, 20).map((artist, index) => (
                        <a
                            key={artist.id}
                            href={artist.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="track-card flex items-center gap-4 p-3 rounded-xl"
                        >
                            <span className={getRankBadgeClass(index + 1)}>
                                {index + 1}
                            </span>
                            <Image
                                src={artist.images[0]?.url || '/placeholder.png'}
                                alt={artist.name}
                                width={48}
                                height={48}
                                className="artist-image"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white truncate">{artist.name}</h4>
                                <p className="text-sm text-gray-400 truncate">
                                    {artist.genres.slice(0, 3).join(', ') || 'Artiste'}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-[#1db954] font-bold">{artist.popularity}%</div>
                                <div className="text-xs text-gray-500">popularité</div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
