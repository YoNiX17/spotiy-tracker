'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface Track {
    trackId: string;
    trackName: string;
    artistName: string;
    albumImage: string;
    playCount: number;
    totalDuration: number;
    previewUrl?: string;
}

interface TopTracksProps {
    tracks: Track[];
    className?: string;
}

export default function TopTracksWithPreview({ tracks, className = '' }: TopTracksProps) {
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [previews, setPreviews] = useState<Map<string, string>>(new Map());
    const [loadingPreviews, setLoadingPreviews] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch preview URLs for tracks
    useEffect(() => {
        const fetchPreviews = async () => {
            if (tracks.length === 0) return;

            const validTrackIds = tracks
                .map(t => t.trackId)
                .filter(id => id && id.length === 22)
                .slice(0, 10);

            if (validTrackIds.length === 0) {
                setLoadingPreviews(false);
                return;
            }

            try {
                const res = await fetch(`/api/previews?ids=${validTrackIds.join(',')}`);
                if (res.ok) {
                    const data = await res.json();
                    const previewMap = new Map<string, string>();
                    data.previews?.forEach((p: { id: string; preview_url: string }) => {
                        if (p.preview_url) {
                            previewMap.set(p.id, p.preview_url);
                        }
                    });
                    setPreviews(previewMap);
                }
            } catch (error) {
                console.error('Error fetching previews:', error);
            } finally {
                setLoadingPreviews(false);
            }
        };

        fetchPreviews();
    }, [tracks]);

    const playPreview = (trackId: string) => {
        const previewUrl = previews.get(trackId);
        if (!previewUrl) return;

        // Stop current audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        if (playingId === trackId) {
            setPlayingId(null);
            return;
        }

        const audio = new Audio(previewUrl);
        audio.volume = 0.3;
        audio.play();
        audio.onended = () => setPlayingId(null);
        audioRef.current = audio;
        setPlayingId(trackId);
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    if (tracks.length === 0) return null;

    return (
        <div className={`glass-panel rounded-2xl p-6 ${className}`}>
            <h3 className="font-[family-name:var(--font-orbitron)] text-lg font-bold text-white mb-4">
                <i className="fa-solid fa-fire text-orange-500 mr-2"></i>
                Les plus écoutés
            </h3>
            <div className="space-y-3">
                {tracks.slice(0, 5).map((track, index) => {
                    const hasPreview = previews.has(track.trackId);
                    const isPlaying = playingId === track.trackId;

                    return (
                        <div key={track.trackId} className="flex items-center gap-3 group">
                            <span className="text-sm font-bold text-gray-500 w-4">{index + 1}</span>

                            {/* Album art with play button */}
                            <div className="relative w-10 h-10 shrink-0">
                                {track.albumImage ? (
                                    <Image
                                        src={track.albumImage}
                                        alt={track.trackName}
                                        width={40}
                                        height={40}
                                        className="album-art rounded-lg"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-[var(--theme-primary,#1db954)]/20 flex items-center justify-center">
                                        <i className="fa-solid fa-music text-[var(--theme-primary,#1db954)] text-sm"></i>
                                    </div>
                                )}

                                {/* Play overlay */}
                                {hasPreview && (
                                    <button
                                        onClick={() => playPreview(track.trackId)}
                                        className={`absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    >
                                        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-white text-xs`}></i>
                                    </button>
                                )}

                                {/* Playing indicator */}
                                {isPlaying && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--theme-primary,#1db954)] rounded-full animate-pulse"></div>
                                )}
                            </div>

                            {/* Track info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-white truncate">{track.trackName}</h4>
                                <p className="text-xs text-gray-400 truncate">{track.artistName}</p>
                            </div>

                            {/* Stats */}
                            <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-[var(--theme-primary,#1db954)]">{track.playCount}×</div>
                                <div className="text-[10px] text-gray-500">{Math.floor(track.totalDuration / 60000)} min</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Audio hint */}
            {!loadingPreviews && previews.size > 0 && (
                <div className="text-center text-[10px] text-gray-600 mt-3">
                    <i className="fa-solid fa-volume-high mr-1"></i>
                    Survole pour écouter un extrait
                </div>
            )}
        </div>
    );
}
