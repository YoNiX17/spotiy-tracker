'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { formatDuration } from '@/lib/spotify';

interface NowPlayingProps {
    className?: string;
}

interface CurrentTrack {
    is_playing: boolean;
    progress_ms: number;
    item: {
        id: string;
        name: string;
        album: {
            name: string;
            images: { url: string }[];
        };
        artists: { name: string }[];
        duration_ms: number;
        external_urls: { spotify: string };
        preview_url: string | null;
    };
}

export default function NowPlaying({ className = '' }: NowPlayingProps) {
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
    const [loading, setLoading] = useState(true);
    const [localProgress, setLocalProgress] = useState(0);
    const lastSyncTime = useRef<number>(Date.now());
    const lastSyncProgress = useRef<number>(0);
    const trackIdRef = useRef<string | null>(null);

    // Fetch now playing data from API
    const fetchNowPlaying = useCallback(async () => {
        try {
            const res = await fetch('/api/now-playing');
            if (res.ok) {
                const data = await res.json();
                const newTrack = data.currentlyPlaying;

                // If different track, reset everything
                if (newTrack?.item?.id !== trackIdRef.current) {
                    trackIdRef.current = newTrack?.item?.id || null;
                    setLocalProgress(newTrack?.progress_ms || 0);
                    lastSyncProgress.current = newTrack?.progress_ms || 0;
                    lastSyncTime.current = Date.now();
                } else if (newTrack?.progress_ms !== undefined) {
                    // Sync with server value
                    setLocalProgress(newTrack.progress_ms);
                    lastSyncProgress.current = newTrack.progress_ms;
                    lastSyncTime.current = Date.now();
                }

                setCurrentTrack(newTrack);
            }
        } catch (error) {
            console.error('Error fetching now playing:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch and periodic sync every 15 seconds
    useEffect(() => {
        fetchNowPlaying();
        const syncInterval = setInterval(fetchNowPlaying, 15000);
        return () => clearInterval(syncInterval);
    }, [fetchNowPlaying]);

    // Smooth local timer - updates every second when playing
    useEffect(() => {
        if (!currentTrack?.is_playing || !currentTrack?.item) return;

        const timerInterval = setInterval(() => {
            setLocalProgress(prev => {
                const newProgress = prev + 1000;
                // Don't exceed track duration
                return Math.min(newProgress, currentTrack.item.duration_ms);
            });
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [currentTrack?.is_playing, currentTrack?.item?.id, currentTrack?.item?.duration_ms]);

    if (loading) {
        return (
            <div className={`now-playing-card rounded-2xl p-6 ${className}`}>
                <div className="flex items-center gap-4">
                    <div className="skeleton w-24 h-24 rounded-xl"></div>
                    <div className="flex-1">
                        <div className="skeleton h-4 w-32 mb-3"></div>
                        <div className="skeleton h-7 w-56 mb-2"></div>
                        <div className="skeleton h-4 w-40"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentTrack || !currentTrack.item) {
        return (
            <div className={`glass-panel rounded-2xl p-8 ${className}`}>
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-spotify-500/20 to-spotify-400/10 flex items-center justify-center">
                        <i className="fa-solid fa-music text-3xl text-spotify-500/50"></i>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-semibold">En ce moment</div>
                        <div className="text-xl font-bold text-gray-300">Rien en lecture</div>
                        <div className="text-sm text-gray-500 mt-1">Lance Spotify pour voir ta musique ici !</div>
                    </div>
                </div>
            </div>
        );
    }

    const progressPercent = (localProgress / currentTrack.item.duration_ms) * 100;

    return (
        <div className={`now-playing-card rounded-2xl p-6 overflow-hidden relative ${className}`}>
            {/* Background blur effect from album art */}
            <div
                className="absolute inset-0 opacity-30 blur-3xl scale-150 pointer-events-none"
                style={{
                    backgroundImage: `url(${currentTrack.item.album.images[0]?.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            <div className="relative z-10">
                <div className="flex items-center gap-4 mb-5">
                    {/* Playing indicator */}
                    {currentTrack.is_playing ? (
                        <div className="playing-bars">
                            <div className="playing-bar"></div>
                            <div className="playing-bar"></div>
                            <div className="playing-bar"></div>
                            <div className="playing-bar"></div>
                        </div>
                    ) : (
                        <i className="fa-solid fa-pause text-spotify-500"></i>
                    )}
                    <span className="text-xs text-spotify-500 uppercase tracking-widest font-bold">
                        {currentTrack.is_playing ? 'En lecture' : 'En pause'}
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    {/* Album art with glow */}
                    <a
                        href={currentTrack.item.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 group"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-spotify-500 rounded-xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <Image
                                src={currentTrack.item.album.images[0]?.url || '/placeholder.png'}
                                alt={currentTrack.item.album.name}
                                width={120}
                                height={120}
                                className="relative album-art-large hover:scale-105 transition-transform rounded-xl shadow-2xl"
                            />
                        </div>
                    </a>

                    {/* Track info */}
                    <div className="flex-1 min-w-0">
                        <a
                            href={currentTrack.item.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <h3 className="font-bold text-2xl text-white truncate group-hover:text-spotify-500 transition-colors">
                                {currentTrack.item.name}
                            </h3>
                        </a>
                        <p className="text-gray-300 truncate text-lg mt-1">
                            {currentTrack.item.artists.map(a => a.name).join(', ')}
                        </p>
                        <p className="text-gray-500 text-sm truncate mt-0.5">
                            {currentTrack.item.album.name}
                        </p>

                        {/* Smooth Progress bar */}
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-mono w-12 tabular-nums">
                                {formatDuration(localProgress)}
                            </span>
                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-spotify-500 to-spotify-400 rounded-full relative"
                                    style={{
                                        width: `${progressPercent}%`,
                                        transition: 'width 1s linear'
                                    }}
                                >
                                    {/* Glowing dot at the end */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg shadow-spotify-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 font-mono w-12 text-right tabular-nums">
                                {formatDuration(currentTrack.item.duration_ms)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
