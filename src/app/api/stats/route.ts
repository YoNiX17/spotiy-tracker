import { NextRequest, NextResponse } from 'next/server';
import {
    getSession,
    getFullHistory,
    getListeningHistory,
    ListeningEntry,
    UserStats,
    updateSessionTokens,
} from '@/lib/pocketbase';
import { SpotifyAPI, refreshAccessToken } from '@/lib/spotify';

type TimePeriod = 'today' | 'week' | 'month' | 'year' | '2025' | '2024' | '2023' | 'all';

function getDateRange(period: TimePeriod): { start: Date; end: Date } {
    const now = new Date();
    const currentYear = now.getFullYear();

    switch (period) {
        case 'today':
            return {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                end: now,
            };
        case 'week':
            return {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now,
            };
        case 'month':
            return {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now,
            };
        case 'year':
            return {
                start: new Date(currentYear, 0, 1),
                end: now,
            };
        case '2025':
            return {
                start: new Date(2025, 0, 1),
                end: new Date(2025, 11, 31, 23, 59, 59),
            };
        case '2024':
            return {
                start: new Date(2024, 0, 1),
                end: new Date(2024, 11, 31, 23, 59, 59),
            };
        case '2023':
            return {
                start: new Date(2023, 0, 1),
                end: new Date(2023, 11, 31, 23, 59, 59),
            };
        case 'all':
        default:
            return {
                start: new Date(0),
                end: now,
            };
    }
}

function filterByPeriod(entries: ListeningEntry[], period: TimePeriod): ListeningEntry[] {
    const { start, end } = getDateRange(period);
    return entries.filter(e => {
        const date = new Date(e.played_at);
        return date >= start && date <= end;
    });
}

// Only count tracks played for 30+ seconds (Spotify standard)
const MIN_PLAY_DURATION_MS = 30000;

function calculateStats(entries: ListeningEntry[]): UserStats {
    // Filter to only include tracks played 30+ seconds
    const validEntries = entries.filter(e => e.duration_ms >= MIN_PLAY_DURATION_MS);

    const uniqueTrackIds = new Set(validEntries.map(e => e.trackId));
    const uniqueArtists = new Set(validEntries.map(e => e.artistName));
    const totalListeningTime = validEntries.reduce((acc, e) => acc + e.duration_ms, 0);

    return {
        totalListeningTime,
        totalTracks: validEntries.length,
        uniqueTracks: uniqueTrackIds.size,
        uniqueArtists: uniqueArtists.size,
        lastUpdated: new Date().toISOString(),
    };
}

function getTopTracks(entries: ListeningEntry[], limit = 10) {
    const trackCounts = new Map<string, {
        trackName: string;
        artistName: string;
        albumImage: string;
        count: number;
        duration: number;
    }>();

    entries.forEach(entry => {
        const existing = trackCounts.get(entry.trackId);
        if (existing) {
            existing.count++;
            existing.duration += entry.duration_ms;
            if (entry.albumImage && !existing.albumImage) {
                existing.albumImage = entry.albumImage;
            }
        } else {
            trackCounts.set(entry.trackId, {
                trackName: entry.trackName,
                artistName: entry.artistName,
                albumImage: entry.albumImage,
                count: 1,
                duration: entry.duration_ms,
            });
        }
    });

    return Array.from(trackCounts.entries())
        .map(([trackId, data]) => ({
            trackId,
            trackName: data.trackName,
            artistName: data.artistName,
            albumImage: data.albumImage,
            playCount: data.count,
            totalDuration: data.duration,
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit);
}

function getTopArtists(entries: ListeningEntry[], limit = 10) {
    const artistCounts = new Map<string, { count: number; duration: number }>();

    entries.forEach(entry => {
        const existing = artistCounts.get(entry.artistName);
        if (existing) {
            existing.count++;
            existing.duration += entry.duration_ms;
        } else {
            artistCounts.set(entry.artistName, {
                count: 1,
                duration: entry.duration_ms,
            });
        }
    });

    return Array.from(artistCounts.entries())
        .map(([artistName, data]) => ({
            artistName,
            artistImage: '', // Will be filled by Spotify API
            playCount: data.count,
            totalDuration: data.duration,
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit);
}

// Fetch artist images from Spotify
async function fetchArtistImages(
    artistNames: string[],
    accessToken: string
): Promise<Map<string, string>> {
    const artistImages = new Map<string, string>();

    // Search for each artist to get their image
    for (const artistName of artistNames.slice(0, 10)) {
        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                const artist = data.artists?.items?.[0];
                if (artist?.images?.[0]?.url) {
                    artistImages.set(artistName, artist.images[0].url);
                }
            }
        } catch (error) {
            console.error(`Error fetching image for ${artistName}:`, error);
        }
    }

    return artistImages;
}

// Fetch track images from Spotify for tracks without images
async function fetchTrackImages(
    tracks: { trackId: string; trackName: string; artistName: string; albumImage: string }[],
    accessToken: string
): Promise<Map<string, string>> {
    const trackImages = new Map<string, string>();

    // Filter tracks that need images
    const tracksNeedingImages = tracks.filter(t => !t.albumImage && t.trackId && t.trackId.length === 22);

    if (tracksNeedingImages.length === 0) return trackImages;

    // Batch fetch track info (max 50 per request)
    const trackIds = tracksNeedingImages.slice(0, 10).map(t => t.trackId);

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.ok) {
            const data = await response.json();
            data.tracks?.forEach((track: any) => {
                if (track?.album?.images?.[0]?.url) {
                    trackImages.set(track.id, track.album.images[0].url);
                }
            });
        }
    } catch (error) {
        console.error('Error fetching track images:', error);
    }

    return trackImages;
}

export async function GET(request: NextRequest) {
    const userId = request.cookies.get('spotify_user_id')?.value;
    const period = (request.nextUrl.searchParams.get('period') || 'all') as TimePeriod;

    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Get session
        const session = await getSession(userId);

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 401 });
        }

        // Check if token needs refresh
        let accessToken = session.accessToken;
        if (Date.now() > session.expiresAt - 60000) {
            try {
                const newTokens = await refreshAccessToken(session.refreshToken);
                accessToken = newTokens.access_token;
                await updateSessionTokens(
                    userId,
                    newTokens.access_token,
                    Date.now() + newTokens.expires_in * 1000
                );
            } catch (error) {
                console.error('Error refreshing token:', error);
            }
        }

        // Get full history
        const fullHistory = await getFullHistory(userId);

        // Filter by period
        const filteredHistory = filterByPeriod(fullHistory, period);

        // Calculate stats for filtered period
        const stats = calculateStats(filteredHistory);

        // Get recent history (always last 50, regardless of period)
        const recentHistory = await getListeningHistory(userId, 50);

        // Get top from filtered history
        const topTracks = getTopTracks(filteredHistory, 10);
        const topArtists = getTopArtists(filteredHistory, 10);

        // Fetch missing track images from Spotify API
        const trackImages = await fetchTrackImages(topTracks, accessToken);

        // Add images to tracks that don't have them
        const topTracksWithImages = topTracks.map(track => ({
            ...track,
            albumImage: track.albumImage || trackImages.get(track.trackId) || '',
        }));

        // Fetch artist images from Spotify API
        const artistNames = topArtists.map(a => a.artistName);
        const artistImages = await fetchArtistImages(artistNames, accessToken);

        // Add images to artists
        const topArtistsWithImages = topArtists.map(artist => ({
            ...artist,
            artistImage: artistImages.get(artist.artistName) || '',
        }));

        return NextResponse.json({
            user: {
                id: session.userId,
                displayName: session.displayName,
                profileImage: session.profileImage,
            },
            stats,
            recentHistory,
            topTracksFromHistory: topTracksWithImages,
            topArtistsFromHistory: topArtistsWithImages,
        });
    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
