'use client';

import { useState, useRef } from 'react';

interface StreamingEntry {
    ts: string;
    ms_played: number;
    master_metadata_track_name: string | null;
    master_metadata_album_artist_name: string | null;
    master_metadata_album_album_name: string | null;
    spotify_track_uri: string | null;
}

interface ImportStats {
    totalEntries: number;
    validEntries: number;
    totalDuration: number;
    uniqueTracks: number;
    uniqueArtists: number;
}

export default function GDPRImport({ userId }: { userId: string }) {
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState<ImportStats | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = async (files: FileList) => {
        setImporting(true);
        setError(null);
        setProgress(0);
        setStats(null);

        const allEntries: StreamingEntry[] = [];

        try {
            // Read all JSON files
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.name.endsWith('.json')) continue;

                const text = await file.text();
                try {
                    const data = JSON.parse(text);
                    if (Array.isArray(data)) {
                        allEntries.push(...data);
                    }
                } catch (e) {
                    console.error(`Error parsing ${file.name}:`, e);
                }

                setProgress(Math.round(((i + 1) / files.length) * 30));
            }

            // Filter valid entries (must have track name and played more than 30 seconds)
            const validEntries = allEntries.filter(entry =>
                entry.master_metadata_track_name &&
                entry.ms_played >= 30000 &&
                entry.spotify_track_uri
            );

            // Convert to our format
            const historyEntries = validEntries.map(entry => ({
                trackId: entry.spotify_track_uri?.split(':')[2] || '',
                trackName: entry.master_metadata_track_name || 'Unknown',
                artistName: entry.master_metadata_album_artist_name || 'Unknown',
                albumName: entry.master_metadata_album_album_name || 'Unknown',
                albumImage: '', // GDPR data doesn't include images
                duration_ms: entry.ms_played,
                played_at: entry.ts,
                spotifyUrl: `https://open.spotify.com/track/${entry.spotify_track_uri?.split(':')[2] || ''}`,
            }));

            setProgress(50);

            // Calculate stats
            const uniqueTrackIds = new Set(historyEntries.map(e => e.trackId));
            const uniqueArtists = new Set(historyEntries.map(e => e.artistName));
            const totalDuration = historyEntries.reduce((acc, e) => acc + e.duration_ms, 0);

            // Send to API in batches
            const batchSize = 500;
            const totalBatches = Math.ceil(historyEntries.length / batchSize);

            for (let i = 0; i < totalBatches; i++) {
                const batch = historyEntries.slice(i * batchSize, (i + 1) * batchSize);

                const response = await fetch('/api/import-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entries: batch }),
                });

                if (!response.ok) {
                    throw new Error('Failed to import batch');
                }

                setProgress(50 + Math.round(((i + 1) / totalBatches) * 50));
            }

            setStats({
                totalEntries: allEntries.length,
                validEntries: validEntries.length,
                totalDuration,
                uniqueTracks: uniqueTrackIds.size,
                uniqueArtists: uniqueArtists.size,
            });

        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setImporting(false);
            setProgress(100);
        }
    };

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        if (hours > 0) {
            return `${hours.toLocaleString()}h ${minutes}min`;
        }
        return `${minutes} min`;
    };

    return (
        <div className="glass-panel rounded-2xl p-6">
            <h2 className="font-[family-name:var(--font-orbitron)] text-xl font-bold text-white mb-4">
                <i className="fa-solid fa-file-import text-[#1db954] mr-3"></i>
                Importer l'historique RGPD
            </h2>

            <div className="text-gray-400 text-sm mb-6">
                <p className="mb-2">
                    Tu peux importer ton historique complet depuis Spotify. Pour obtenir tes données :
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-500">
                    <li>Va sur <a href="https://www.spotify.com/account/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1db954] hover:underline">spotify.com/account/privacy</a></li>
                    <li>Clique sur "Demander mes données" → "Historique de streaming étendu"</li>
                    <li>Attends le mail de Spotify (1-30 jours)</li>
                    <li>Télécharge et décompresse les fichiers</li>
                    <li>Importe les fichiers JSON ici</li>
                </ol>
            </div>

            {/* File Input */}
            <div className="mb-6">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    multiple
                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className={`w-full py-4 rounded-xl border-2 border-dashed transition-all ${importing
                            ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                            : 'border-[#1db954]/30 text-[#1db954] hover:border-[#1db954] hover:bg-[#1db954]/10'
                        }`}
                >
                    {importing ? (
                        <span>
                            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                            Importation en cours...
                        </span>
                    ) : (
                        <span>
                            <i className="fa-solid fa-upload mr-2"></i>
                            Sélectionner les fichiers JSON
                        </span>
                    )}
                </button>
            </div>

            {/* Progress Bar */}
            {importing && (
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progression</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="progress-bar h-2">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                    <i className="fa-solid fa-exclamation-circle mr-2"></i>
                    {error}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="p-4 rounded-xl bg-[#1db954]/10 border border-[#1db954]/30">
                    <h3 className="font-bold text-[#1db954] mb-3">
                        <i className="fa-solid fa-check-circle mr-2"></i>
                        Import terminé !
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-xl font-bold text-white">{stats.validEntries.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Écoutes importées</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white">{formatDuration(stats.totalDuration)}</div>
                            <div className="text-xs text-gray-400">Temps d'écoute</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white">{stats.uniqueTracks.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Titres uniques</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white">{stats.uniqueArtists.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">Artistes</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
