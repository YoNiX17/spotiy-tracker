'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface RecommendedTrack {
    id: string;
    name: string;
    artist: string;
    album: string;
    image: string;
    preview_url: string | null;
    spotifyUrl: string;
}

export default function Recommendations({ className = '' }: { className?: string }) {
    const [tracks, setTracks] = useState<RecommendedTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await fetch('/api/recommendations');
                if (res.ok) {
                    const data = await res.json();
                    setTracks(data.tracks);
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    const playPreview = (track: RecommendedTrack) => {
        if (!track.preview_url) return;

        // Stop current audio
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }

        if (playingId === track.id) {
            setPlayingId(null);
            return;
        }

        const newAudio = new Audio(track.preview_url);
        newAudio.volume = 0.3;
        newAudio.play();
        newAudio.onended = () => setPlayingId(null);
        setAudio(newAudio);
        setPlayingId(track.id);
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audio) {
                audio.pause();
            }
        };
    }, [audio]);

    if (loading) {
        return (
            <div className={`glass-panel rounded-2xl p-4 ${className}`}>
                <div className="skeleton h-32 w-full rounded-lg"></div>
            </div>
        );
    }

    if (tracks.length === 0) {
        return (
            <div className={`glass-panel rounded-2xl p-4 ${className}`}>
                <div className="text-center text-gray-500 text-sm py-4">
                    Pas assez de données pour les recommandations
                </div>
            </div>
        );
    }

    return (
        <div className={`glass-panel rounded-2xl p-4 ${className}`}>
            <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">
                💡 Tu vas aimer
            </h3>

            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {tracks.slice(0, 5).map(track => (
                    <div
                        key={track.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                        {/* Album art with play button */}
                        <div className="relative w-10 h-10 shrink-0">
                            <Image
                                src={track.image || '/placeholder.png'}
                                alt={track.album}
                                fill
                                className="rounded object-cover"
                            />
                            {track.preview_url && (
                                <button
                                    onClick={() => playPreview(track)}
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded"
                                >
                                    <i className={`fa-solid ${playingId === track.id ? 'fa-pause' : 'fa-play'} text-white text-xs`}></i>
                                </button>
                            )}
                            {playingId === track.id && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[var(--theme-primary,#1db954)] rounded-full animate-pulse"></div>
                            )}
                        </div>

                        {/* Track info */}
                        <div className="flex-1 min-w-0">
                            <a
                                href={track.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-white truncate block hover:text-[var(--theme-primary,#1db954)] transition-colors"
                            >
                                {track.name}
                            </a>
                            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
