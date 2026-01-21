import { NextRequest, NextResponse } from 'next/server';
import { getSession, getFullHistory, updateSessionTokens } from '@/lib/pocketbase';
import { refreshAccessToken } from '@/lib/spotify';

interface AudioFeatures {
    energy: number;
    danceability: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    tempo: number;
}

export async function GET(request: NextRequest) {
    const userId = request.cookies.get('spotify_user_id')?.value;
    const period = request.nextUrl.searchParams.get('period') || 'week';

    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const session = await getSession(userId);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 401 });
        }

        // Refresh token if needed
        let accessToken = session.accessToken;
        if (Date.now() > session.expiresAt - 60000) {
            try {
                const newTokens = await refreshAccessToken(session.refreshToken);
                accessToken = newTokens.access_token;
                await updateSessionTokens(userId, newTokens.access_token, Date.now() + newTokens.expires_in * 1000);
            } catch (e) {
                console.error('Token refresh failed:', e);
            }
        }

        // Get history and filter by period
        const history = await getFullHistory(userId);

        // Filter by period (default: last week)
        const now = Date.now();
        const periodMs = period === 'month' ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        const startDate = new Date(now - periodMs);

        const filteredHistory = history.filter(t => new Date(t.played_at) >= startDate);

        // Filter valid track IDs (non-empty, valid Spotify format)
        const validTrackIds = filteredHistory
            .map(t => t.trackId)
            .filter(id => id && id.length === 22)
            .slice(0, 100);

        // Get unique IDs
        const uniqueTrackIds = [...new Set(validTrackIds)].slice(0, 50);

        console.log(`Mood API: Found ${filteredHistory.length} tracks this ${period}, ${uniqueTrackIds.length} unique valid IDs`);

        if (uniqueTrackIds.length === 0) {
            return NextResponse.json({ error: 'No valid tracks to analyze' }, { status: 404 });
        }

        // Fetch audio features from Spotify
        const allFeatures: AudioFeatures[] = [];

        const response = await fetch(
            `https://api.spotify.com/v1/audio-features?ids=${uniqueTrackIds.join(',')}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.ok) {
            const data = await response.json();
            const validFeatures = (data.audio_features || []).filter((f: any) => f !== null);
            allFeatures.push(...validFeatures);
        }

        console.log(`Mood API: Got ${allFeatures.length} audio features`);

        if (allFeatures.length === 0) {
            // Return default mood if no features available
            return NextResponse.json({
                energy: 0.5,
                danceability: 0.5,
                valence: 0.5,
                acousticness: 0.3,
                instrumentalness: 0.1,
                tempo: 120,
                mood: 'Équilibré',
                moodEmoji: '✨',
            });
        }

        // Calculate averages
        const avg = {
            energy: allFeatures.reduce((a, f) => a + f.energy, 0) / allFeatures.length,
            danceability: allFeatures.reduce((a, f) => a + f.danceability, 0) / allFeatures.length,
            valence: allFeatures.reduce((a, f) => a + f.valence, 0) / allFeatures.length,
            acousticness: allFeatures.reduce((a, f) => a + f.acousticness, 0) / allFeatures.length,
            instrumentalness: allFeatures.reduce((a, f) => a + f.instrumentalness, 0) / allFeatures.length,
            tempo: allFeatures.reduce((a, f) => a + f.tempo, 0) / allFeatures.length,
        };

        // Determine mood based on features
        let mood = 'Chill';
        let moodEmoji = '😌';

        if (avg.energy > 0.7 && avg.valence > 0.6) {
            mood = 'Euphorique';
            moodEmoji = '🔥';
        } else if (avg.energy > 0.7 && avg.valence < 0.4) {
            mood = 'Intense';
            moodEmoji = '⚡';
        } else if (avg.energy < 0.4 && avg.valence > 0.6) {
            mood = 'Peaceful';
            moodEmoji = '☀️';
        } else if (avg.energy < 0.4 && avg.valence < 0.4) {
            mood = 'Mélancolique';
            moodEmoji = '🌙';
        } else if (avg.danceability > 0.7) {
            mood = 'Groovy';
            moodEmoji = '💃';
        } else if (avg.acousticness > 0.6) {
            mood = 'Acoustique';
            moodEmoji = '🎸';
        } else {
            mood = 'Équilibré';
            moodEmoji = '✨';
        }

        return NextResponse.json({
            ...avg,
            mood,
            moodEmoji,
        });
    } catch (error) {
        console.error('Mood error:', error);
        return NextResponse.json({ error: 'Failed to analyze mood' }, { status: 500 });
    }
}
