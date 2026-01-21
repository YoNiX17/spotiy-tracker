import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSessionTokens, saveListeningHistory, ListeningEntry } from '@/lib/pocketbase';
import { SpotifyAPI, refreshAccessToken } from '@/lib/spotify';

export async function GET(request: NextRequest) {
    const userId = request.cookies.get('spotify_user_id')?.value;

    if (!userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Get session from Firebase
        let session = await getSession(userId);

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 401 });
        }

        // Check if token expired
        if (Date.now() >= session.expiresAt) {
            // Refresh the token
            const newTokens = await refreshAccessToken(session.refreshToken);
            session.accessToken = newTokens.access_token;
            session.expiresAt = Date.now() + newTokens.expires_in * 1000;
            await updateSessionTokens(userId, session.accessToken, session.expiresAt);
        }

        const spotify = new SpotifyAPI(session.accessToken);

        // Get currently playing
        const currentlyPlaying = await spotify.getCurrentlyPlaying();

        // Get recently played
        const recentlyPlayed = await spotify.getRecentlyPlayed(50);

        // Save to Firebase history
        if (recentlyPlayed && recentlyPlayed.items) {
            const entries: ListeningEntry[] = recentlyPlayed.items.map(item => ({
                trackId: item.track.id,
                trackName: item.track.name,
                artistName: item.track.artists.map(a => a.name).join(', '),
                albumName: item.track.album.name,
                albumImage: item.track.album.images[0]?.url || '',
                duration_ms: item.track.duration_ms,
                played_at: item.played_at,
                spotifyUrl: item.track.external_urls.spotify,
            }));

            await saveListeningHistory(userId, entries);
        }

        return NextResponse.json({
            currentlyPlaying,
            recentlyPlayed: recentlyPlayed?.items || [],
        });
    } catch (error: any) {
        console.error('Now playing error:', error);

        if (error.message === 'TOKEN_EXPIRED') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }

        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
