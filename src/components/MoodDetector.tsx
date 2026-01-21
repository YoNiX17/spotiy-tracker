'use client';

import { useEffect, useState } from 'react';

interface MoodData {
    energy: number;
    danceability: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    tempo: number;
    mood: string;
    moodEmoji: string;
}

export default function MoodDetector({ className = '' }: { className?: string }) {
    const [mood, setMood] = useState<MoodData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMood = async () => {
            try {
                const res = await fetch('/api/mood?period=week');
                if (res.ok) {
                    const data = await res.json();
                    setMood(data);
                }
            } catch (error) {
                console.error('Error fetching mood:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMood();
    }, []);

    if (loading) {
        return (
            <div className={`glass-panel rounded-2xl p-4 ${className}`}>
                <div className="skeleton h-24 w-full rounded-lg"></div>
            </div>
        );
    }

    if (!mood) {
        return (
            <div className={`glass-panel rounded-2xl p-4 ${className}`}>
                <div className="text-center text-gray-500 text-sm py-4">
                    Écoute cette semaine pour voir ta vibe
                </div>
            </div>
        );
    }

    const features = [
        { name: 'Énergie', value: mood.energy, color: 'from-red-500 to-orange-500' },
        { name: 'Dansabilité', value: mood.danceability, color: 'from-pink-500 to-purple-500' },
        { name: 'Positivité', value: mood.valence, color: 'from-yellow-500 to-green-500' },
        { name: 'Acoustique', value: mood.acousticness, color: 'from-blue-500 to-cyan-500' },
    ];

    return (
        <div className={`glass-panel rounded-2xl p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                    🎭 Ta Vibe
                </h3>
                <span className="text-2xl">{mood.moodEmoji}</span>
            </div>

            {/* Mood label */}
            <div className="text-center mb-4">
                <span className="text-lg font-bold text-white">{mood.mood}</span>
                <div className="text-xs text-gray-500 mt-1">
                    ~{Math.round(mood.tempo)} BPM • Cette semaine
                </div>
            </div>

            {/* Feature bars */}
            <div className="space-y-2">
                {features.map(feature => (
                    <div key={feature.name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-20 truncate">{feature.name}</span>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${feature.color} rounded-full transition-all duration-500`}
                                style={{ width: `${feature.value * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">
                            {Math.round(feature.value * 100)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
